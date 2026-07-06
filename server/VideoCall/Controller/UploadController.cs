using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VideoCall.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp",  // Images
            ".mp3", ".m4a", ".aac", ".wav", ".ogg", ".caf", ".3gp", ".webm", // Audio/Video
            ".mp4", ".mov"                              // Video
        };

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // POST /api/upload — upload single file, return public URL
        [HttpPost]
        public async Task<IActionResult> Upload([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Không có file được gửi lên" });

                if (file.Length > 50 * 1024 * 1024) // 50MB limit
                    return BadRequest(new { message = "File quá lớn (tối đa 50MB)" });

                var ext = Path.GetExtension(file.FileName)?.ToLower();
                if (string.IsNullOrEmpty(ext)) 
                {
                    if (file.ContentType.Contains("audio")) ext = ".m4a";
                    else if (file.ContentType.Contains("video")) ext = ".mp4";
                    else ext = ".jpg";
                }

                if (!AllowedExtensions.Contains(ext))
                    return BadRequest(new { message = $"Định dạng {ext} không được hỗ trợ" });

                var webRoot = string.IsNullOrEmpty(_env.WebRootPath)
                    ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
                    : _env.WebRootPath;

                var uploadsPath = Path.Combine(webRoot, "uploads");
                Directory.CreateDirectory(uploadsPath);

                var fileName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";
                var fileUrl = $"{baseUrl}/uploads/{fileName}";

                // Determine media type
                var mediaType = ext.ToLower() switch
                {
                    ".mp3" or ".m4a" or ".aac" or ".wav" or ".ogg" => "Audio",
                    ".mp4" or ".mov" => "Video",
                    _ => "Image"
                };

                return Ok(new { url = fileUrl, mediaType, fileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi upload file: " + ex.Message });
            }
        }
    }
}
