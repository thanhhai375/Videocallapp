using Microsoft.AspNetCore.Mvc;
using VideoCall.Application.Interfaces;
using VideoCall.Domain.Entities;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;

        public FriendController(IRepository<User> userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("request")]
        public IActionResult SendFriendRequest([FromBody] FriendRequestDto request)
        {
            if (string.IsNullOrEmpty(request.PhoneNumber))
                return BadRequest(new { message = "Số điện thoại không hợp lệ" });

            var users = _userRepository.GetAll().ToList();
            var targetUser = users.FirstOrDefault(u => u.PhoneNumber == request.PhoneNumber);

            if (targetUser == null)
                return NotFound(new { message = "Không tìm thấy người dùng với số điện thoại này" });

            // In a real app, we would save a Friendship or FriendRequest entity here.
            // For now, we return success so the UI can show the success alert.

            return Ok(new { message = $"Đã gửi lời mời kết bạn đến {targetUser.Name}!" });
        }
    }

    public class FriendRequestDto
    {
        public string PhoneNumber { get; set; }
    }
}
