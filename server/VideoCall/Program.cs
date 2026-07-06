using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VideoCall.Application.Services;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;
using VideoCall.Infrastructure.SignalR;

var builder = WebApplication.CreateBuilder(args);

// ── DATABASE ──────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=videocalldb;Username=videocall_user;Password=videocall_secret_password_2024";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── JWT AUTHENTICATION ─────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "VideoCallApp_SuperSecret_JWT_Key_2024_Min32Chars!";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "VideoCallApp",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "VideoCallApp",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Allow JWT from query string for SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── SERVICES ──────────────────────────────────────────────────────────
builder.Services.AddScoped<JwtService>();
builder.Services.AddSignalR();
builder.Services.AddControllers();

// ── CORS ──────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", p =>
        p.AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
         .SetIsOriginAllowed(_ => true));
});

var app = builder.Build();

// ── AUTO MIGRATE & SEED ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // Auto-create all tables

    // Seed admin user if none exist
    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User { Username = "admin", PhoneNumber = "0900000000", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin" },
            new User { Username = "Nam", PhoneNumber = "0901111111", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
            new User { Username = "Hung", PhoneNumber = "0902222222", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
            new User { Username = "Lan", PhoneNumber = "0903333333", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
            new User { Username = "Minh", PhoneNumber = "0904444444", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") }
        );
        db.SaveChanges();
    }

    // Seed new requested users
    var newUsers = new List<User>
    {
        new User { Username = "Trí", PhoneNumber = "0782938463", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
        new User { Username = "Châu", PhoneNumber = "0866707354", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
        new User { Username = "Huy", PhoneNumber = "0775656005", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
        new User { Username = "Lợi", PhoneNumber = "0347904403", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") },
        new User { Username = "Hải", PhoneNumber = "0326017487", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") }
    };

    foreach (var u in newUsers)
    {
        if (!db.Users.Any(x => x.PhoneNumber == u.PhoneNumber))
        {
            db.Users.Add(u);
        }
    }
    db.SaveChanges();
}

// ── MIDDLEWARE PIPELINE ───────────────────────────────────────────────
app.UseDefaultFiles(new DefaultFilesOptions { DefaultFileNames = new List<string> { "login.html" } });
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<VideoCallHub>("/hubs");
app.MapFallbackToFile("index.html");

app.Run();
