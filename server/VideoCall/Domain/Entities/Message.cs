namespace VideoCall.Domain.Entities
{
    public enum MessageType { Text, Image, Video, Audio, File }

    public class Message
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public MessageType MessageType { get; set; } = MessageType.Text;
        public string? MediaUrl { get; set; }
        public long? FileSize { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EditedAt { get; set; }

        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
        public ICollection<MessageReadReceipt> ReadReceipts { get; set; } = new List<MessageReadReceipt>();
        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    }
}