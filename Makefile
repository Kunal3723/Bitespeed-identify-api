.PHONY: help install build dev test clean docker-build docker-up docker-down docker-logs test-api json-tests

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build the TypeScript application
	npm run build

dev: ## Start development server
	npm run dev

test: ## Run tests
	npm test

clean: ## Clean build artifacts
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage

docker-build: ## Build Docker image
	docker-compose build

docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Clean Docker containers and volumes
	docker-compose down -v
	docker system prune -f

test-api: ## Test the API endpoints
	node test-api.js

json-tests: ## Run tests defined in test.json (requires docker services running)
	node run-json-tests.js

setup: install build ## Setup the project (install + build)

start: docker-up ## Start the application with Docker

stop: docker-down ## Stop the application

restart: stop start ## Restart the application

logs: docker-logs ## View application logs
