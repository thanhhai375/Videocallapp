namespace VideoCall.Domain.Entities
{
    public class MessageReaction
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid MessageId { get; set; }
        public Guid UserId { get; set; }
        public string EmojiCode { get; set; } = string.Empty; // e.g. "❤️", "😂"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Message Message { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
