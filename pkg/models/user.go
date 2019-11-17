package models

import "database/sql"

type UserModel struct {
	DB *sql.DB
}

// Creates a table for the model
func (user *UserModel) CreateTable() error {
	q := `
		CREATE TABLE IF NOT EXISTS users(
			id INT AUTO_INCREMENT PRIMARY KEY,
			email VARCHAR(150) DEFAULT "",
			firstname VARCHAR(150) DEFAULT "",
			lastname VARCHAR(150) DEFAULT "",
			password VARCHAR(150) DEFAULT "",
			active BOOL DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)ENGINE=INNODB
	`
	_, err := user.DB.Exec(q)
	return err
}
