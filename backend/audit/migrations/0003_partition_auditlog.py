from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0002_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
DO $$
BEGIN
    IF current_setting('server_version_num')::int >= 100000 THEN
        -- Rename old table
        ALTER TABLE audit_auditlog RENAME TO audit_auditlog_old;
        
        -- Create partitioned table
        CREATE TABLE audit_auditlog (
            id uuid NOT NULL,
            action varchar(100) NOT NULL,
            entity_type varchar(100) NOT NULL,
            entity_id varchar(64) NOT NULL,
            old_value jsonb NULL,
            new_value jsonb NULL,
            ip_address inet NULL,
            created_at timestamp with time zone NOT NULL,
            user_id bigint NULL
        ) PARTITION BY RANGE (created_at);

        -- Setup primary key and index
        ALTER TABLE audit_auditlog ADD CONSTRAINT audit_auditlog_pkey PRIMARY KEY (id, created_at);
        CREATE INDEX audit_audit_entity__62dd24_idx ON audit_auditlog (entity_type, entity_id);

        -- Setup partitions
        CREATE TABLE audit_auditlog_y2025 PARTITION OF audit_auditlog FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
        CREATE TABLE audit_auditlog_y2026 PARTITION OF audit_auditlog FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
        CREATE TABLE audit_auditlog_y2027 PARTITION OF audit_auditlog FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
        CREATE TABLE audit_auditlog_default PARTITION OF audit_auditlog DEFAULT;

        -- Migrate data
        INSERT INTO audit_auditlog SELECT id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at, user_id FROM audit_auditlog_old;
        
        -- Cleanup
        DROP TABLE audit_auditlog_old CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping partition creation (possibly not PostgreSQL or already partitioned)';
END $$;
''',
            reverse_sql=migrations.RunSQL.noop
        )
    ]
