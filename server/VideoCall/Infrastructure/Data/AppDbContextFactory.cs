using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Infrastructure.Data
{
    /// <summary>
    /// Allows EF Core Tools (dotnet ef) to create AppDbContext at design time
    /// without needing to start the full application.
    /// </summary>
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

            // Default local dev connection - same as docker-compose
            optionsBuilder.UseNpgsql(
                "Host=localhost;Port=5433;Database=videocalldb;Username=videocall_user;Password=videocall_secret_password_2024"
            );

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
