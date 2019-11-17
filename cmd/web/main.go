package main

import (
	"database/sql"
	"flag"
	"fmt"
	"fupiz.com/pkg/models"
	_ "github.com/go-sql-driver/mysql"
	"log"
	"net/http"
	"os"
)

type application struct {
	errorLog  *log.Logger
	infoLog   *log.Logger
	DB        *sql.DB
	userModel *models.UserModel
	linkModel *models.LinkModel
}

func main() {
	// Initiate start up variables
	port := flag.Int("port", 4000, "HTTP server port")
	addr := flag.String("address", "localhost", "HTTP server address")
	dsn := flag.String("dsn", "root:temate@/fupiz", "Database Source Name")
	flag.Parse()

	// Create loggers
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)

	// Open the database
	db, err := openDB(*dsn)
	if err != nil {
		errorLog.Fatalln(err)
	}
	defer db.Close()

	// Create an instance of the application
	app := &application{
		errorLog:  errorLog,
		infoLog:   infoLog,
		DB:        db,
		userModel: &models.UserModel{DB: db},
		linkModel: &models.LinkModel{DB: db},
	}

	// Create tables (move this to proper migrations)
	if err = app.userModel.CreateTable(); err != nil {
		errorLog.Fatalln(err)
	}
	if err = app.linkModel.CreateTable(); err != nil {
		errorLog.Fatalln(err)
	}

	// Create an HTTP server and start
	baseAddr := fmt.Sprintf("%s:%d", *addr, *port)
	server := http.Server{
		Addr:    baseAddr,
		Handler: app.router(),
	}

	infoLog.Println(fmt.Sprintf("Starting server at %s", baseAddr))
	errorLog.Fatalln(server.ListenAndServe())
}

// Opens a connection to the database and returns a pointer to it.
func openDB(dsn string) (*sql.DB, error) {
	DB, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	if err = DB.Ping(); err != nil {
		return nil, err
	}
	return DB, nil
}
