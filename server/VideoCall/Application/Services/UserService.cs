using VideoCall.Application.Interfaces;
using VideoCall.Domain.Entities;

namespace VideoCall.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> userRepo;
        // Dictionary chỉ dùng để map ConnectionId với User khi Online
        private readonly Dictionary<string, User> _onlineUsers = new();

        public UserService(IRepository<User> userRepo)
        {
            this.userRepo = userRepo;
        }

        // Đăng nhập người dùng
        public Task<User?> LoginAsync(string name, string password)
        {
            var user = this.userRepo.GetAll().FirstOrDefault(u => u.Name == name);
            return Task.FromResult(
                user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)
                    ? user
                    : null
            );
        }

        // Đánh dấu User online và lưu connectionId
        public Task SetOnlineAsync(string userId, string connectionId)
        {
            var user = userRepo.GetAll().FirstOrDefault(u => u.Id == userId);
            if (user == null) return Task.CompletedTask;

            user.SetOnline(connectionId);
            _onlineUsers[connectionId] = user; 
            return Task.CompletedTask;
        }

        // Xóa User khỏi danh sách online
        public Task<User?> SetOfflineAsync(string connectionId)
        {
            if (_onlineUsers.Remove(connectionId, out var user))
            {
                user.SetOffline();
                return Task.FromResult<User?>(user);
            }
            return Task.FromResult<User?>(null);
        }

         // Lấy tất cả User và trạng thái online/offline(trừ bản thân)
        public Task<List<User>> GetAllUsersWithStatusAsync(string currentUserId)
        {
            var allUsers = userRepo.GetAll()
                .Where(u => u.Id != currentUserId) 
                .Select(u => {
                    var isOnline = _onlineUsers.Values.Any(onlineU => onlineU.Id == u.Id);
                    if (isOnline)
                    {
                        var onlineUser = _onlineUsers.Values.First(ou => ou.Id == u.Id);
                        u.SetOnline(onlineUser.ConnectionId!);
                    }
                    else
                    {
                        u.SetOffline();
                    }
                    return u;
                })
                .ToList();

            return Task.FromResult(allUsers);
        }

 
        public Task<List<User>> GetOnlineFriendsAsync(string currentUserId) => Task.FromResult(new List<User>());
         // Tìm user đang online theo connectionId của SignalR    
        public User? GetByConnectionId(string connectionId) => _onlineUsers.GetValueOrDefault(connectionId);
        // Tìm user đang online theo userId
        public User? GetOnlineUserById(string userId) => _onlineUsers.Values.FirstOrDefault(u => u.Id == userId);
        // Lấy toàn bộ user từ DB
        public IReadOnlyList<User> GetAllUsers() => userRepo.GetAll();
    }
}
