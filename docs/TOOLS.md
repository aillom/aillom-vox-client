# 🛠️ Client Tools Guide

Client Tools allow the AI to interact with your application's UI. When the AI determines that a specific action is needed (like ending a call or showing an alert), it calls a tool, and your application executes it.

---

## 📋 Architecture

### CLIENT-side Tools
Executed **locally** in your application (browser, mobile app, CLI):
- Control UI elements
- Handle navigation
- Manage connections
- Display notifications

### SERVER-side Tools
Executed on **AillomVox servers** (you cannot register these):
- Access databases
- Call external APIs
- Query RAG systems
- Server-side logic

> **Rule**: If it controls **your app's UI**, it's a CLIENT tool. If it accesses **server resources**, it's a SERVER tool.

---

## 🚀 Quick Start

### 1. Register Tools

```javascript
await client.connect({
    provider: 'gemini',
    voice: 'Puck',
    tools: [
        {
            name: 'hangup',
            description: 'End the current call',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    ]
});
```

### 2. Handle Tool Calls

```javascript
client.on('tool_call', async (tool) => {
    console.log(`AI requested: ${tool.name}`, tool.args);
    
    if (tool.name === 'hangup') {
        await client.disconnect();
        return 'Call ended successfully';
    }
});
```

### 3. Send Result Back

The return value from your handler is automatically sent back to the AI, allowing it to continue the conversation.

---

## 📦 Tool Definition Format

```javascript
{
    name: 'tool_name',           // Unique identifier (match in handler)
    description: 'What it does', // AI uses this to decide when to call
    parameters: {                // JSON Schema for arguments
        type: 'object',
        properties: {
            arg1: { 
                type: 'string', 
                description: 'First argument' 
            },
            arg2: { 
                type: 'number', 
                description: 'Second argument' 
            }
        },
        required: ['arg1']      // Mandatory arguments
    }
}
```

---

## 🎯 Common Tools

### 1. Hangup (End Call)

```javascript
{
    name: 'hangup',
    description: 'End the call when user says goodbye',
    parameters: { type: 'object', properties: {} }
}

// Handler
client.on('tool_call', async (tool) => {
    if (tool.name === 'hangup') {
        await client.disconnect();
        return 'Call ended';
    }
});
```

### 2. Show Alert

```javascript
{
    name: 'show_alert',
    description: 'Display important message to user',
    parameters: {
        type: 'object',
        properties: {
            message: { 
                type: 'string', 
                description: 'Alert message' 
            },
            severity: { 
                type: 'string', 
                enum: ['info', 'warning', 'error'],
                description: 'Alert type'
            }
        },
        required: ['message']
    }
}

// Handler
client.on('tool_call', async (tool) => {
    if (tool.name === 'show_alert') {
        alert(`[${tool.args.severity}] ${tool.args.message}`);
        return 'Alert displayed';
    }
});
```

### 3. Navigate to Page

```javascript
{
    name: 'navigate_to_page',
    description: 'Navigate user to a specific page',
    parameters: {
        type: 'object',
        properties: {
            url: { 
                type: 'string', 
                description: 'Target URL' 
            }
        },
        required: ['url']
    }
}

// Handler
client.on('tool_call', async (tool) => {
    if (tool.name === 'navigate_to_page') {
        window.location.href = tool.args.url;
        return 'Navigating';
    }
});
```

### 4. Update UI Element

```javascript
{
    name: 'highlight_element',
    description: 'Highlight UI element to draw user attention',
    parameters: {
        type: 'object',
        properties: {
            element_id: { type: 'string', description: 'DOM element ID' },
            color: { type: 'string', description: 'Highlight color' }
        },
        required: ['element_id']
    }
}

// Handler
client.on('tool_call', async (tool) => {
    if (tool.name === 'highlight_element') {
        const el = document.getElementById(tool.args.element_id);
        el.style.border = `3px solid ${tool.args.color || 'yellow'}`;
        return 'Element highlighted';
    }
});
```

---

## 🧪 Testing Tools

### Manual Testing

```javascript
// Simulate AI calling a tool
client.emit('tool_call', {
    name: 'show_alert',
    args: { message: 'Test alert', severity: 'info' }
});
```

### Debugging

```javascript
client.on('tool_call', async (tool) => {
    console.log('=== TOOL CALL ===');
    console.log('Name:', tool.name);
    console.log('Args:', tool.args);
    console.log('ID:', tool.call_id);
    
    // Your handler logic here
    const result = await handleTool(tool);
    
    console.log('Result:', result);
    return result;
});
```

---

## ⚠️ Best Practices

### 1. Clear Descriptions
```javascript
// ❌ Bad
description: 'Does something'

// ✅ Good
description: 'End the call when user says goodbye or wants to finish'
```

### 2. Validate Arguments
```javascript
client.on('tool_call', async (tool) => {
    if (tool.name === 'navigate_to_page') {
        // Validate
        if (!tool.args.url || !tool.args.url.startsWith('http')) {
            return 'Error: Invalid URL';
        }
        
        window.location.href = tool.args.url;
        return 'Navigating to ' + tool.args.url;
    }
});
```

### 3. Return Meaningful Results
```javascript
// ❌ Bad
return 'ok';

// ✅ Good
return 'Alert shown successfully with message: "' + tool.args.message + '"';
```

This helps the AI understand what happened and continue the conversation naturally.

---

## 🔒 Security

### Client Tools are Safe
- Executed in **your app**, not on our servers
- You have **full control** over what they do
- No sensitive data is sent to the server

### Never Trust User Input
```javascript
// ❌ Dangerous
client.on('tool_call', async (tool) => {
    eval(tool.args.code); // NEVER DO THIS
});

// ✅ Safe
client.on('tool_call', async (tool) => {
    const allowedUrls = ['https://myapp.com/dashboard', 'https://myapp.com/profile'];
    if (allowedUrls.includes(tool.args.url)) {
        window.location.href = tool.args.url;
    }
});
```

---

## 📚 Examples

See complete working examples in:
- [Browser Example](../examples/browser/) - Full UI with tools
- [Node.js CLI](../examples/nodejs/) - CLI bot with hangup
- [Python Example](../examples/python/) - Python integration

---

## 💡 Tips

1. **Start Simple**: Begin with just `hangup`, then add more
2. **Test Locally**: Use manual emit to test without calling the AI
3. **Return Clear Messages**: AI uses return value to continue conversation
4. **Validate Everything**: Never trust arguments blindly
5. **Keep it Fast**: Tool execution should be instant (< 100ms)

---

Happy building! 🎉
