from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

import main
from models import Reparacion, Repuesto, RolUsuario, Usuario


def test_rn02_rechaza_consumo_mayor_al_stock():
    """RN-02: el inventario no puede quedar con saldo negativo."""
    motor_pruebas = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    motor_original = main.engine
    main.engine = motor_pruebas
    SQLModel.metadata.create_all(motor_pruebas)
    main.app.dependency_overrides[main.obtener_usuario_actual] = lambda: Usuario(
        username="supervisor-prueba",
        hashed_password="no-se-usa-en-esta-prueba",
        rol=RolUsuario.SUPERVISOR,
    )

    try:
        with TestClient(main.app) as client:
            with Session(motor_pruebas) as session:
                session.add(
                    Repuesto(
                        codigo="RN02-001",
                        nombre="Repuesto de prueba",
                        stock_disponible=2,
                        ubicacion="Banco de pruebas",
                    )
                )
                session.add(Reparacion(equipo="EQ-PRUEBA", descripcion="Prueba RN-02"))
                session.commit()

            respuesta = client.post(
                "/reparaciones/1/consumos",
                json={"codigo_repuesto": "RN02-001", "cantidad": 3},
            )

            assert respuesta.status_code == 409
            assert "Stock insuficiente" in respuesta.json()["error"]

            with Session(motor_pruebas) as session:
                repuesto = session.get(Repuesto, "RN02-001")
                assert repuesto.stock_disponible == 2
    finally:
        main.app.dependency_overrides.clear()
        main.engine = motor_original
