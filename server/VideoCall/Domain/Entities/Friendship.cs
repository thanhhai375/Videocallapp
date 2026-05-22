namespace VideoCall.Domain.Entities
{
    public class Friendship
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid User1Id { get; set; }
        public Guid User2Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User1 { get; set; } = null!;
        public User User2 { get; set; } = null!;
    }
}
