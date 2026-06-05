#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000
os.chdir(r'c:\Users\justi\Downloads\Accesory store')

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor corriendo en http://localhost:{PORT}")
    print(f"Presiona Ctrl+C para detener")
    httpd.serve_forever()
