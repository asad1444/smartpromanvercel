# .NET API Backend Setup Guide

## ✅ Frontend Configuration (Already Done)

The frontend is now configured to work with your .NET API:

1. **Vite Proxy**: Configured to forward `/api` requests to `http://localhost:5000`
2. **API Client**: Updated to handle both development and production environments
3. **Environment Variables**: Set up for flexible deployment

## 🔧 .NET Backend CORS Configuration

### Add CORS in Program.cs (or Startup.cs)

```csharp
// Program.cs (.NET 6+)
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ⭐ ADD CORS CONFIGURATION
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:3000",      // Vite dev server
                "http://localhost:5173",      // Alternative Vite port
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ⭐ USE CORS (Must be before UseAuthorization)
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Alternative: Allow All Origins (Development Only)

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// In middleware
app.UseCors("AllowAll");
```

## 🚀 How to Run

### 1. Start .NET Backend
```bash
cd path/to/your/backend
dotnet run
```
Backend should be running on: `http://localhost:5000`

### 2. Start React Frontend
```bash
cd "g:\SMART_PRO_MAN_FRONTEND (2)\SMART_PRO_MAN_FRONTEND\my-app"
npm run dev
```
Frontend should be running on: `http://localhost:3000`

### 3. Test the Connection
Open browser console (F12) and check for:
- ✅ API calls to `/api/...` should work
- ✅ No CORS errors
- ✅ Data loading properly

## 🔍 Testing API Endpoints

### Test in Browser
```
http://localhost:5000/api/Dispatch/tickets
```

### Test in Console
```javascript
fetch('/api/Dispatch/tickets')
  .then(r => r.json())
  .then(data => console.log('Data:', data))
```

## 📝 Important Notes

1. **Development Mode**: Uses Vite proxy (no CORS issues)
2. **Production Mode**: 
   - Set `VITE_API_URL` in `.env` to your production API URL
   - Update CORS policy in backend to allow production domain
3. **Authentication**: JWT token is automatically sent from `localStorage`

## ⚠️ Common Issues

### Issue 1: Port Already in Use
```bash
# Change port in backend (appsettings.json or launchSettings.json)
# Or kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 2: CORS Still Not Working
- Make sure `app.UseCors()` is BEFORE `app.UseAuthorization()`
- Restart both frontend and backend
- Clear browser cache (Ctrl+Shift+Delete)

### Issue 3: 404 Not Found
- Check controller routing: `[Route("api/[controller]")]`
- Verify endpoint exists in Swagger UI
- Check API method name matches the call

## 📦 Sample Controller Structure

```csharp
[ApiController]
[Route("api/[controller]")]
public class DispatchController : ControllerBase
{
    [HttpGet("tickets")]
    public IActionResult GetTickets()
    {
        var tickets = new List<object>
        {
            new
            {
                crn = "CR-2024-001",
                crid = "CRID-1042",
                time = "09:15 AM",
                date = "22-Aug-2024",
                request = "Test Request",
                kind = "Maintenance",
                category = "VIP Call",
                zone = "Zone A",
                status = "Pending",
                statusClass = "pending",
                companies = new[]
                {
                    new { name = "Test Company", highlighted = true }
                }
            }
        };
        
        return Ok(tickets);
    }
}
```

## ✅ Checklist

- [ ] Backend running on port 5000
- [ ] CORS configured in Program.cs
- [ ] Frontend running on port 3000
- [ ] Proxy configured in vite.config.js
- [ ] API endpoints returning proper JSON
- [ ] Browser console shows no errors
