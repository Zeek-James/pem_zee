"""
Seed data script for Palm Oil Management System
Creates default roles and permissions for RBAC
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Role, Permission, User, Organization, Farm, Plantation, Buyer
from datetime import date
import config


def seed_database():
    """Initialize database with default roles and permissions"""

    # Connect to database
    engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("Starting database seeding...")

        # ============= CREATE PERMISSIONS =============
        print("\n1. Creating permissions...")

        resources = ['harvest', 'milling', 'storage', 'sales', 'dashboard', 'reports', 'users']
        actions = ['create', 'read', 'update', 'delete']

        permissions = {}

        for resource in resources:
            for action in actions:
                # Check if permission already exists
                existing = session.query(Permission).filter_by(
                    resource=resource,
                    action=action
                ).first()

                if existing:
                    permissions[f"{resource}:{action}"] = existing
                    print(f"   ✓ Permission already exists: {resource}:{action}")
                else:
                    permission = Permission(
                        resource=resource,
                        action=action,
                        description=f"{action.capitalize()} {resource}"
                    )
                    session.add(permission)
                    session.flush()  # Get the ID
                    permissions[f"{resource}:{action}"] = permission
                    print(f"   + Created permission: {resource}:{action}")

        session.commit()
        print(f"   Total permissions: {len(permissions)}")


        # ============= CREATE ROLES =============
        print("\n2. Creating roles...")

        # --- ADMIN ROLE ---
        admin_role = session.query(Role).filter_by(name='Admin').first()
        if not admin_role:
            admin_role = Role(
                name='Admin',
                description='Full system access - can perform all operations'
            )
            session.add(admin_role)
            session.flush()

            # Admin gets ALL permissions
            for perm in permissions.values():
                admin_role.permissions.append(perm)

            print("   + Created Admin role with ALL permissions")
        else:
            print("   ✓ Admin role already exists")


        # --- MANAGER ROLE ---
        manager_role = session.query(Role).filter_by(name='Manager').first()
        if not manager_role:
            manager_role = Role(
                name='Manager',
                description='Operations management - can manage harvest, milling, sales, and view reports'
            )
            session.add(manager_role)
            session.flush()

            # Manager permissions
            manager_permissions = [
                'harvest:create', 'harvest:read', 'harvest:update', 'harvest:delete',
                'milling:create', 'milling:read', 'milling:update', 'milling:delete',
                'storage:read',
                'sales:create', 'sales:read', 'sales:update', 'sales:delete',
                'dashboard:read',
                'reports:create', 'reports:read', 'reports:update', 'reports:delete',
            ]

            for perm_key in manager_permissions:
                if perm_key in permissions:
                    manager_role.permissions.append(permissions[perm_key])

            print(f"   + Created Manager role with {len(manager_permissions)} permissions")
        else:
            print("   ✓ Manager role already exists")


        # --- OPERATOR ROLE ---
        operator_role = session.query(Role).filter_by(name='Operator').first()
        if not operator_role:
            operator_role = Role(
                name='Operator',
                description='Daily operations - can create/read harvest, milling, sales'
            )
            session.add(operator_role)
            session.flush()

            # Operator permissions
            operator_permissions = [
                'harvest:create', 'harvest:read',
                'milling:create', 'milling:read',
                'storage:read',
                'sales:create', 'sales:read',
                'dashboard:read',
            ]

            for perm_key in operator_permissions:
                if perm_key in permissions:
                    operator_role.permissions.append(permissions[perm_key])

            print(f"   + Created Operator role with {len(operator_permissions)} permissions")
        else:
            print("   ✓ Operator role already exists")


        # --- VIEWER ROLE ---
        viewer_role = session.query(Role).filter_by(name='Viewer').first()
        if not viewer_role:
            viewer_role = Role(
                name='Viewer',
                description='Read-only access - can view all data but not modify'
            )
            session.add(viewer_role)
            session.flush()

            # Viewer permissions (read-only)
            viewer_permissions = [
                'harvest:read',
                'milling:read',
                'storage:read',
                'sales:read',
                'dashboard:read',
                'reports:read',
            ]

            for perm_key in viewer_permissions:
                if perm_key in permissions:
                    viewer_role.permissions.append(permissions[perm_key])

            print(f"   + Created Viewer role with {len(viewer_permissions)} permissions")
        else:
            print("   ✓ Viewer role already exists")


        session.commit()
        print("\n3. Roles created successfully!")


        # ============= CREATE SAMPLE ORGANIZATION =============
        print("\n4. Creating sample organization...")

        org = session.query(Organization).filter_by(code='ORG001').first()
        if not org:
            org = Organization(
                name='Palm Oil Industries Ltd',
                code='ORG001',
                address='123 Palm Avenue, Lagos, Nigeria',
                phone='+234-800-123-4567',
                email='info@palmoil.com',
                is_active=True
            )
            session.add(org)
            session.flush()
            print("   + Created organization: Palm Oil Industries Ltd")
        else:
            print("   ✓ Organization already exists")

        session.commit()


        # ============= CREATE SAMPLE FARMS =============
        print("\n5. Creating sample farms...")

        farm1 = session.query(Farm).filter_by(name='Owerri Estate').first()
        if not farm1:
            farm1 = Farm(
                organization_id=org.id,
                name='Owerri Estate',
                location='Owerri, Imo State, Nigeria',
                total_area_hectares=500.0,
                is_active=True
            )
            session.add(farm1)
            session.flush()
            print("   + Created farm: Owerri Estate")
        else:
            print("   ✓ Owerri Estate already exists")

        farm2 = session.query(Farm).filter_by(name='Aba Plantation').first()
        if not farm2:
            farm2 = Farm(
                organization_id=org.id,
                name='Aba Plantation',
                location='Aba, Abia State, Nigeria',
                total_area_hectares=350.0,
                is_active=True
            )
            session.add(farm2)
            session.flush()
            print("   + Created farm: Aba Plantation")
        else:
            print("   ✓ Aba Plantation already exists")

        session.commit()


        # ============= CREATE SAMPLE PLANTATIONS =============
        print("\n6. Creating sample plantations...")

        plantation1 = session.query(Plantation).filter_by(code='PLN001').first()
        if not plantation1:
            plantation1 = Plantation(
                farm_id=farm1.id,
                name='Owerri North Block',
                code='PLN001',
                area_hectares=250.0,
                tree_count=5000,
                planting_date=date(2015, 3, 15),
                is_active=True
            )
            session.add(plantation1)
            print("   + Created plantation: Owerri North Block (PLN001)")
        else:
            print("   ✓ Plantation PLN001 already exists")

        plantation2 = session.query(Plantation).filter_by(code='PLN002').first()
        if not plantation2:
            plantation2 = Plantation(
                farm_id=farm1.id,
                name='Owerri South Block',
                code='PLN002',
                area_hectares=250.0,
                tree_count=4800,
                planting_date=date(2016, 5, 20),
                is_active=True
            )
            session.add(plantation2)
            print("   + Created plantation: Owerri South Block (PLN002)")
        else:
            print("   ✓ Plantation PLN002 already exists")

        plantation3 = session.query(Plantation).filter_by(code='PLN003').first()
        if not plantation3:
            plantation3 = Plantation(
                farm_id=farm2.id,
                name='Aba Main Block',
                code='PLN003',
                area_hectares=350.0,
                tree_count=7000,
                planting_date=date(2014, 8, 10),
                is_active=True
            )
            session.add(plantation3)
            print("   + Created plantation: Aba Main Block (PLN003)")
        else:
            print("   ✓ Plantation PLN003 already exists")

        session.commit()


        # ============= CREATE SAMPLE BUYERS =============
        print("\n7. Creating sample buyers...")

        buyer1 = session.query(Buyer).filter_by(company_name='Nigeria Oil Mills Ltd').first()
        if not buyer1:
            buyer1 = Buyer(
                organization_id=org.id,
                company_name='Nigeria Oil Mills Ltd',
                contact_person='Chukwuma Okafor',
                phone='+234-803-111-2222',
                email='procurement@nigeriaoilmills.com',
                address='45 Industrial Road, Port Harcourt, Nigeria',
                payment_terms='30 days credit',
                is_active=True
            )
            session.add(buyer1)
            print("   + Created buyer: Nigeria Oil Mills Ltd")
        else:
            print("   ✓ Nigeria Oil Mills Ltd already exists")

        buyer2 = session.query(Buyer).filter_by(company_name='Golden Palm Processors').first()
        if not buyer2:
            buyer2 = Buyer(
                organization_id=org.id,
                company_name='Golden Palm Processors',
                contact_person='Amina Bello',
                phone='+234-805-333-4444',
                email='orders@goldenpalm.com',
                address='12 Trading Street, Kano, Nigeria',
                payment_terms='Cash on delivery',
                is_active=True
            )
            session.add(buyer2)
            print("   + Created buyer: Golden Palm Processors")
        else:
            print("   ✓ Golden Palm Processors already exists")

        session.commit()


        # ============= CREATE DEFAULT ADMIN USER (Optional) =============
        print("\n8. Checking for admin user...")

        admin_user = session.query(User).filter_by(username='admin').first()
        if not admin_user:
            create_admin = input("   Create default admin user? (y/n): ").lower().strip()

            if create_admin == 'y':
                admin_user = User(
                    username='admin',
                    email='admin@palmoil.com',
                    full_name='System Administrator',
                    role_id=admin_role.id,
                    organization_id=org.id,
                    is_active=True
                )
                admin_user.set_password('admin123')  # Default password

                session.add(admin_user)
                session.commit()

                print("\n   ✅ Default admin user created!")
                print("   -----------------------------------")
                print("   Username: admin")
                print("   Password: admin123")
                print("   Email: admin@palmoil.com")
                print("   -----------------------------------")
                print("   ⚠️  IMPORTANT: Change this password immediately after first login!")
            else:
                print("   ⏭️  Skipped admin user creation")
        else:
            print("   ✓ Admin user already exists")


        # ============= SUMMARY =============
        print("\n" + "="*60)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)

        # Count stats
        total_permissions = session.query(Permission).count()
        total_roles = session.query(Role).count()
        total_users = session.query(User).count()
        total_orgs = session.query(Organization).count()
        total_farms = session.query(Farm).count()
        total_plantations = session.query(Plantation).count()
        total_buyers = session.query(Buyer).count()

        print(f"\n📊 Summary:")
        print(f"   • Organizations: {total_orgs}")
        print(f"   • Farms: {total_farms}")
        print(f"   • Plantations: {total_plantations}")
        print(f"   • Buyers: {total_buyers}")
        print(f"   • Permissions: {total_permissions}")
        print(f"   • Roles: {total_roles}")
        print(f"   • Users: {total_users}")

        print(f"\n🎯 Available Roles:")
        for role in session.query(Role).all():
            perm_count = len(role.permissions)
            print(f"   • {role.name}: {perm_count} permissions - {role.description}")

        print("\n✅ System is ready for authentication and authorization!")
        print("="*60 + "\n")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        session.close()


if __name__ == '__main__':
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     PALM OIL MANAGEMENT SYSTEM - DATABASE SEEDING        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)

    seed_database()
