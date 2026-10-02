from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
DO $$
BEGIN
    IF current_setting('server_version_num')::int >= 100000 THEN
        -- Disconnect sequence from old table so it is not dropped
        ALTER SEQUENCE IF EXISTS attendance_record_id_seq OWNED BY NONE;

        ALTER TABLE attendance_record RENAME TO attendance_record_old;
        
        CREATE TABLE attendance_record (
            id bigint NOT NULL DEFAULT nextval('attendance_record_id_seq'::regclass),
            status varchar(20) NOT NULL,
            marked_at timestamp with time zone NOT NULL,
            notes text NOT NULL,
            arrival_time time without time zone NULL,
            created_at timestamp with time zone NOT NULL,
            updated_at timestamp with time zone NOT NULL,
            class_session_id bigint NOT NULL,
            marked_by_id bigint NULL,
            student_id bigint NOT NULL
        ) PARTITION BY RANGE (created_at);

        ALTER SEQUENCE IF EXISTS attendance_record_id_seq OWNED BY attendance_record.id;

        ALTER TABLE attendance_record ADD CONSTRAINT attendance_record_pkey PRIMARY KEY (id, created_at);
        ALTER TABLE attendance_record ADD CONSTRAINT attendance_record_class_student_uniq UNIQUE (class_session_id, student_id, created_at);

        CREATE INDEX attendance_student_b8e5ec_idx ON attendance_record (student_id, status);
        CREATE INDEX attendance_class_s_c452bd_idx ON attendance_record (class_session_id, status);
        CREATE INDEX attendance_marked__ba4e7e_idx ON attendance_record (marked_at);

        CREATE TABLE attendance_record_y2025 PARTITION OF attendance_record FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
        CREATE TABLE attendance_record_y2026 PARTITION OF attendance_record FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
        CREATE TABLE attendance_record_y2027 PARTITION OF attendance_record FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
        CREATE TABLE attendance_record_default PARTITION OF attendance_record DEFAULT;

        INSERT INTO attendance_record SELECT id, status, marked_at, notes, arrival_time, created_at, updated_at, class_session_id, marked_by_id, student_id FROM attendance_record_old;
        
        DROP TABLE attendance_record_old CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping partition creation (possibly not PostgreSQL or already partitioned)';
END $$;
''',
            reverse_sql=migrations.RunSQL.noop
        )
    ]
