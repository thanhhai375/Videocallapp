namespace VideoCall.Domain.Entities
{
    public class MessageReadReceipt
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid MessageId { get; set; }
        public Guid ReaderId { get; set; }
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;

        public Message Message { get; set; } = null!;
        public User Reader { get; set; } = null!;
    }
}
