using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VideoCall.Domain.Entities;
using VideoCall.Infrastructure.Data;

namespace VideoCall.Application.Services
{
    public class JwtService
    {
        private readonly IConfiguration _config;
        private readonly AppDbContext _db;

        public JwtService(IConfiguration config, AppDbContext db)
        {
            _config = config;
            _db = db;
        }

        public string GenerateAccessToken(User user)
        {
            var secret = _config["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("phone", user.PhoneNumber),
            };

            var expiryMinutes = int.Parse(_config["Jwt:AccessTokenExpirationMinutes"] ?? "15");

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<RefreshToken> GenerateRefreshToken(Guid userId, HttpContext httpContext)
        {
            var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpirationDays"] ?? "30");
            var token = new RefreshToken
            {
                UserId = userId,
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            };
            _db.RefreshTokens.Add(token);

            // Track session
            var session = new UserSession
            {
                UserId = userId,
                Platform = httpContext.Request.Headers["X-Platform"].FirstOrDefault() ?? "Unknown",
                IpAddress = httpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            };
            _db.UserSessions.Add(session);

            await _db.SaveChangesAsync();
            return token;
        }

        public ClaimsPrincipal? ValidateAccessToken(string token)
        {
            var secret = _config["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
            var handler = new JwtSecurityTokenHandler();
            try
            {
                return handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                    ValidateIssuer = true,
                    ValidIssuer = _config["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _config["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                }, out _);
            }
            catch { return null; }
        }

        public async Task RevokeRefreshToken(string token)
        {
            var existing = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == token);
            if (existing != null)
            {
                existing.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
    }
}
