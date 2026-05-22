
using Microsoft.AspNetCore.Mvc;
using System.Text;
using VideoCall.Application.Interfaces;
using VideoCall.Domain.Entities;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController(IUserService userService) : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await userService.LoginAsync(model.Name, model.Password);
            if (user == null) return Unauthorized("Sai tên hoặc mật khẩu");

             if (user.IsOnline)
             {
                 return Conflict("Tài khoản này đang được sử dụng bởi một thiết bị khác.");
             }
            
            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes(user.Id));
            return Ok(new { token, name = user.Name });
        }
    }
}
