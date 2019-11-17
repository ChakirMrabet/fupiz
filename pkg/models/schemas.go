package models

import (
	"time"
)

type LinkSchema struct {
	ID                  int
	src, dest, duration string
	enabled, protected  bool
	password            string
	userID              int
	createdAt           time.Time
}

type UserSchema struct {
	ID                                   int
	email, firstname, lastname, password string
	active                               bool
	createdAt                            time.Time
}
