using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VideoCall.Controller
{
    [Authorize] 
    [ApiController]
    [Route("api/[controller]")]
    public class ProtectedController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetData()
        {
            return Ok($"Dữ liệu bí mật cho {User.Identity.Name}");
        }
    }
}
