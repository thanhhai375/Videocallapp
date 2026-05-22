using VideoCall.Domain.Entities;

namespace VideoCall.Application.Interfaces
{
    public interface IUserService
    {
        Task<User?> LoginAsync(string name, string password);
        Task SetOnlineAsync(string userId, string connectionId);
        Task<User?> SetOfflineAsync(string connectionId);
        Task<List<User>> GetAllUsersWithStatusAsync(string currentUserId);

        Task<List<User>> GetOnlineFriendsAsync(string currentUserId);
        User? GetByConnectionId(string connectionId);
        User? GetOnlineUserById(string userId);
        IReadOnlyList<User> GetAllUsers();
    }
}