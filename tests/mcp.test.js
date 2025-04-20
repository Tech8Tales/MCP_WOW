const { test, expect } = require('@playwright/test');
const { MCPServer } = require('../src/server');

describe('MCP Server Tests', () => {
    let mcpServer;

    beforeEach(async () => {
        mcpServer = new MCPServer();
        await mcpServer.start();
    });

    afterEach(async () => {
        await mcpServer.stop();
    });

    describe('Server Setup', () => {
        test('should start the server successfully', async () => {
            expect(mcpServer.isRunning()).toBe(true);
        });

        test('should have correct configuration', async () => {
            const config = mcpServer.getConfig();
            expect(config).toBeDefined();
            expect(config.client).toBe('vscode');
        });
    });

    describe('Connection Tests', () => {
        test('should accept client connection', async () => {
            const client = await mcpServer.createTestClient();
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
        });

        test('should handle multiple client connections', async () => {
            const client1 = await mcpServer.createTestClient();
            const client2 = await mcpServer.createTestClient();
            
            expect(client1.isConnected()).toBe(true);
            expect(client2.isConnected()).toBe(true);
            
            await Promise.all([
                client1.disconnect(),
                client2.disconnect()
            ]);
        });
    });

    describe('Message Protocol Tests', () => {
        let client;

        beforeEach(async () => {
            client = await mcpServer.createTestClient();
        });

        afterEach(async () => {
            await client.disconnect();
        });

        test('should handle basic request-response', async () => {
            const response = await client.sendRequest('ping');
            expect(response).toBe('pong');
        });

        test('should handle error scenarios', async () => {
            await expect(
                client.sendRequest('invalid_command')
            ).rejects.toThrow('Invalid command');
        });

        test('should handle large payloads', async () => {
            const largeData = 'x'.repeat(1000000); // 1MB of data
            const response = await client.sendRequest('echo', { data: largeData });
            expect(response.data).toBe(largeData);
        });
    });

    describe('Protocol Feature Tests', () => {
        test('should support model context operations', async () => {
            const client = await mcpServer.createTestClient();
            
            const modelContext = {
                model: 'test-model',
                parameters: {
                    temperature: 0.7,
                    maxTokens: 100
                }
            };

            const response = await client.setModelContext(modelContext);
            expect(response.success).toBe(true);
            
            const retrievedContext = await client.getModelContext();
            expect(retrievedContext).toEqual(modelContext);
            
            await client.disconnect();
        });

        test('should handle streaming responses', async () => {
            const client = await mcpServer.createTestClient();
            const messages = [];

            await client.streamResponse('test_stream', {
                onMessage: (msg) => messages.push(msg)
            });

            expect(messages.length).toBeGreaterThan(0);
            expect(messages.every(msg => typeof msg === 'string')).toBe(true);
            
            await client.disconnect();
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should reconnect after connection loss', async () => {
            const client = await mcpServer.createTestClient();
            await client.simulateConnectionDrop();
            
            // Wait for auto-reconnect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
        });

        test('should handle server restart', async () => {
            const client = await mcpServer.createTestClient();
            await mcpServer.restart();
            
            // Wait for server to come back up
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            expect(mcpServer.isRunning()).toBe(true);
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
        });
    });

    describe('Performance Tests', () => {
        test('should handle concurrent requests', async () => {
            const client = await mcpServer.createTestClient();
            const requests = Array(100).fill(null).map(() => 
                client.sendRequest('ping')
            );
            
            const responses = await Promise.all(requests);
            expect(responses.every(r => r === 'pong')).toBe(true);
            
            await client.disconnect();
        });

        test('should maintain response times under load', async () => {
            const client = await mcpServer.createTestClient();
            const start = Date.now();
            
            await Promise.all(Array(50).fill(null).map(() => 
                client.sendRequest('ping')
            ));
            
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            
            await client.disconnect();
        });
    });
});