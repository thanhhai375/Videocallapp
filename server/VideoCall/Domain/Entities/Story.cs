namespace VideoCall.Domain.Entities
{
    public class Story
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string? TextContent { get; set; }
        public string? MediaUrl { get; set; }
        public string MediaType { get; set; } = "Text"; // Text | Image | Video
        public string? BackgroundColor { get; set; } = "#0084FF";
        public int ViewCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);

        // Navigation
        public User User { get; set; } = null!;
        public ICollection<StoryView> Views { get; set; } = new List<StoryView>();
    }

    public class StoryView
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StoryId { get; set; }
        public Guid ViewerId { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

        public Story Story { get; set; } = null!;
        public User Viewer { get; set; } = null!;
    }
}
