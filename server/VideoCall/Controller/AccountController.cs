using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VideoCall.Application.Interfaces;
using VideoCall.Domain.Entities;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/[controller]")] // Route: /api/Account
    public class AccountController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;
        
        public AccountController(IRepository<User> userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("login")] // Endpoint: /api/Account/login
        public async Task<IActionResult> Login([FromBody] Model.LoginRequest request)
        {
            // 1. TÌM KIẾM NGƯỜI DÙNG
            var user = _userRepository.GetAll()
                                      .FirstOrDefault(u => u.Name.Equals(request.Username, StringComparison.OrdinalIgnoreCase));

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
            }

            // 2. TẠO CLAIMS VÀ ĐĂNG NHẬP (Xác thực thành công)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Name),
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);
            
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, claimsPrincipal);

            // 3. TRẢ VỀ THÀNH CÔNG
            // Trong ứng dụng SPA (như của bạn), API nên trả về 200 OK
            // và client (JavaScript trong login.html) sẽ xử lý chuyển hướng.
            return Ok(new { message = "Đăng nhập thành công" });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { message = "Đăng xuất thành công" });
        }
    }
}
  
