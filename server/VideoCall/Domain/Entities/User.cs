// Domain/Entities/User.cs
namespace VideoCall.Domain.Entities
{
    public class User
    {
        public string Id { get; private set; } = Guid.NewGuid().ToString();
        public string Name { get; private set; }
        public string PasswordHash { get; private set; }
        public bool IsOnline { get; private set; }
        public string? ConnectionId { get; private set; }

        public User(string name, string passwordHash)
        {
            Name = name;
            PasswordHash = passwordHash;
        }

        public void SetOnline(string connectionId)
        {
            this.IsOnline = true;
            this.ConnectionId = connectionId;
        }

        public void SetOffline()
        {
            IsOnline = false;
            ConnectionId = null;
        }
    }
}
