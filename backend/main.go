package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Product represents a product entity
type Product struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	Category string  `json:"category"`
	InStock  bool    `json:"inStock"`
}

// ProductStore manages products in memory
type ProductStore struct {
	mu       sync.RWMutex
	products map[string]Product
}

// NewProductStore creates a new product store with mock data
func NewProductStore() *ProductStore {
	store := &ProductStore{
		products: make(map[string]Product),
	}

	// Add initial mock products
	mockProducts := []Product{
		{
			ID:       uuid.New().String(),
			Name:     "Wireless Mouse",
			Price:    29.99,
			Category: "Electronics",
			InStock:  true,
		},
		{
			ID:       uuid.New().String(),
			Name:     "Mechanical Keyboard",
			Price:    89.99,
			Category: "Electronics",
			InStock:  true,
		},
		{
			ID:       uuid.New().String(),
			Name:     "USB-C Cable",
			Price:    12.99,
			Category: "Accessories",
			InStock:  false,
		},
		{
			ID:       uuid.New().String(),
			Name:     "Laptop Stand",
			Price:    45.00,
			Category: "Accessories",
			InStock:  true,
		},
		{
			ID:       uuid.New().String(),
			Name:     "Webcam HD",
			Price:    79.99,
			Category: "Electronics",
			InStock:  true,
		},
	}

	for _, p := range mockProducts {
		store.products[p.ID] = p
	}

	return store
}

// GetAll returns all products
func (s *ProductStore) GetAll() []Product {
	s.mu.RLock()
	defer s.mu.RUnlock()

	products := make([]Product, 0, len(s.products))
	for _, p := range s.products {
		products = append(products, p)
	}
	return products
}

// GetByID returns a product by ID
func (s *ProductStore) GetByID(id string) (Product, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	product, exists := s.products[id]
	return product, exists
}

// Create adds a new product
func (s *ProductStore) Create(product Product) Product {
	s.mu.Lock()
	defer s.mu.Unlock()

	product.ID = uuid.New().String()
	product.InStock = true // Default to in stock
	s.products[product.ID] = product
	return product
}

// Update modifies an existing product
func (s *ProductStore) Update(id string, product Product) (Product, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.products[id]; !exists {
		return Product{}, false
	}

	product.ID = id
	s.products[id] = product
	return product, true
}

// Delete removes a product
func (s *ProductStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.products[id]; !exists {
		return false
	}

	delete(s.products, id)
	return true
}

// Server handles HTTP requests
type Server struct {
	store *ProductStore
}

// NewServer creates a new server
func NewServer() *Server {
	return &Server{
		store: NewProductStore(),
	}
}

// CORS middleware
func (s *Server) enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// JSON response helper
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Error response helper
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// GET /api/products - Get all products
func (s *Server) handleGetProducts(w http.ResponseWriter, r *http.Request) {
	products := s.store.GetAll()
	writeJSON(w, http.StatusOK, products)
}

// GET /api/products/:id - Get product by ID
func (s *Server) handleGetProduct(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/products/")

	if id == "" {
		writeError(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	product, exists := s.store.GetByID(id)
	if !exists {
		writeError(w, http.StatusNotFound, "Product not found")
		return
	}

	writeJSON(w, http.StatusOK, product)
}

// POST /api/products - Create new product
func (s *Server) handleCreateProduct(w http.ResponseWriter, r *http.Request) {
	var product Product

	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if product.Name == "" || product.Price <= 0 || product.Category == "" {
		writeError(w, http.StatusBadRequest, "Name, price, and category are required")
		return
	}

	created := s.store.Create(product)
	writeJSON(w, http.StatusCreated, created)
}

// PUT /api/products/:id - Update product
func (s *Server) handleUpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/products/")

	if id == "" {
		writeError(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	var product Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updated, exists := s.store.Update(id, product)
	if !exists {
		writeError(w, http.StatusNotFound, "Product not found")
		return
	}

	writeJSON(w, http.StatusOK, updated)
}

// DELETE /api/products/:id - Delete product
func (s *Server) handleDeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/products/")

	if id == "" {
		writeError(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	if !s.store.Delete(id) {
		writeError(w, http.StatusNotFound, "Product not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Product deleted successfully"})
}

// Router handles request routing
func (s *Server) router(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	method := r.Method

	// Route: GET /api/products
	if path == "/api/products" && method == "GET" {
		s.handleGetProducts(w, r)
		return
	}

	// Route: POST /api/products
	if path == "/api/products" && method == "POST" {
		s.handleCreateProduct(w, r)
		return
	}

	// Route: GET /api/products/:id
	if strings.HasPrefix(path, "/api/products/") && method == "GET" {
		s.handleGetProduct(w, r)
		return
	}

	// Route: PUT /api/products/:id
	if strings.HasPrefix(path, "/api/products/") && method == "PUT" {
		s.handleUpdateProduct(w, r)
		return
	}

	// Route: DELETE /api/products/:id
	if strings.HasPrefix(path, "/api/products/") && method == "DELETE" {
		s.handleDeleteProduct(w, r)
		return
	}

	// 404 Not Found
	writeError(w, http.StatusNotFound, "Endpoint not found")
}

// Health check endpoint
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
	})
}

func main() {
	server := NewServer()

	// Register routes
	http.HandleFunc("/api/health", server.enableCORS(server.handleHealth))
	http.HandleFunc("/api/products", server.enableCORS(server.router))
	http.HandleFunc("/api/products/", server.enableCORS(server.router))

	port := ":8081"
	fmt.Printf("🚀 Server starting on http://localhost%s\n", port)
	fmt.Println("📦 Mock products loaded")
	fmt.Println("\nAvailable endpoints:")
	fmt.Println("  GET    /api/health")
	fmt.Println("  GET    /api/products")
	fmt.Println("  GET    /api/products/:id")
	fmt.Println("  POST   /api/products")
	fmt.Println("  PUT    /api/products/:id")
	fmt.Println("  DELETE /api/products/:id")

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
