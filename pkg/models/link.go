package models

import (
	"database/sql"
)

type LinkModel struct {
	DB *sql.DB
}

// Creates a table for the model
func (link *LinkModel) CreateTable() error {
	q := `
		CREATE TABLE IF NOT EXISTS links(
			id INT AUTO_INCREMENT PRIMARY KEY,
			src TEXT NOT NULL,
			dest VARCHAR(30) DEFAULT "",
			duration VARCHAR(10) DEFAULT "",
			enabled BOOL DEFAULT true,
			protected BOOL DEFAULT false,
			password VARCHAR(15) DEFAULT "",
			user_id INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id)
				REFERENCES users (id)
				ON UPDATE RESTRICT
				ON DELETE CASCADE
		)ENGINE=INNODB
			
	`
	_, err := link.DB.Exec(q)
	return err
}
