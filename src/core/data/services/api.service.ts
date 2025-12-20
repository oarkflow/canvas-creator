export class ApiService {
	constructor(private baseURL: string = '/api') {}
	
	async get<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${this.baseURL}${endpoint}`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}
	
	async post<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await fetch(`${this.baseURL}${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}
	
	async put<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await fetch(`${this.baseURL}${endpoint}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return response.json();
	}
	
	async delete(endpoint: string): Promise<void> {
		const response = await fetch(`${this.baseURL}${endpoint}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
	}
}