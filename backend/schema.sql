-- schema.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_permissions (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE cardlogs (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift_no VARCHAR(20) NOT NULL,
    operator VARCHAR(100) NOT NULL,
    unit_no VARCHAR(20) NOT NULL,
    
    -- Item Checklist
    lampu_depan VARCHAR(50),
    lampu_belakang VARCHAR(50),
    ban_depan VARCHAR(50),
    ban_belakang VARCHAR(50),
    klakson VARCHAR(50),
    alarm_mundur VARCHAR(50),
    rem_jalan VARCHAR(50),
    rem_parkir VARCHAR(50),
    sabuk_pengaman VARCHAR(50),
    kebersihan VARCHAR(50),
    
    -- Operasional Unit
    hm_awal DECIMAL(10,2),
    hm_akhir DECIMAL(10,2),
    odometer_awal DECIMAL(10,2),
    odometer_akhir DECIMAL(10,2),
    charging_durasi DECIMAL(10,2),
    
    -- Metadata
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cardlog_activities (
    id SERIAL PRIMARY KEY,
    cardlog_id INT REFERENCES cardlogs(id) ON DELETE CASCADE,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial permissions
INSERT INTO permissions (name) VALUES 
('cardlog_view'),
('cardlog_add'),
('cardlog_edit'),
('cardlog_delete'),
('cardlog_export'),
('user_management');

-- We'll create the admin user from node or manual script with bcrypt hash.
