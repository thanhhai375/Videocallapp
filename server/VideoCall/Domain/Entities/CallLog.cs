namespace VideoCall.Domain.Entities
{
    public enum CallType { Audio, Video }
    public enum CallStatus { Missed, Completed, Rejected, Failed }

    public class CallLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CallerId { get; set; }
        public Guid ReceiverId { get; set; }
        public CallType CallType { get; set; } = CallType.Audio;
        public CallStatus Status { get; set; } = CallStatus.Missed;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
        public int? DurationSeconds { get; set; }

        public User Caller { get; set; } = null!;
        public User Receiver { get; set; } = null!;
    }
}
