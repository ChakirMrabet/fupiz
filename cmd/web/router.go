package main

import (
	"net/http"
)

func (app *application) router() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
		res.Write([]byte("Hello World!"))
	})
	return mux
}
