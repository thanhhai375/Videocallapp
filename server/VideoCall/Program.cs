using VideoCall.Application.Interfaces;
using VideoCall.Application.Services;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;
using VideoCall.Infrastructure.SignalR;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IRepository<User>>(sp =>
{
    var users = new List<User>
    {
        new("Nam", BCrypt.Net.BCrypt.HashPassword("123")),
        new("Hung", BCrypt.Net.BCrypt.HashPassword("123")), 
        new("Lan", BCrypt.Net.BCrypt.HashPassword("123")),
        new("Minh", BCrypt.Net.BCrypt.HashPassword("123"))
    };
    return new InMemoryRepository<User>(users);
});

builder.Services.AddSingleton<IRepository<Friendship>>(sp =>
    new InMemoryRepository<Friendship>(new List<Friendship>()));

builder.Services.AddSingleton<IUserService, UserService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();

builder.Services.AddSignalR();
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", p =>
        p.AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
         .SetIsOriginAllowed(_ => true));
});

var app = builder.Build();

app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = new List<string> { "login.html" }
});

app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");


app.MapControllers();
app.MapHub<VideoCallHub>("/hubs");
app.MapFallbackToFile("index.html");
app.Run();
