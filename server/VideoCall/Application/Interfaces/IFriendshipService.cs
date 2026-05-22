
namespace VideoCall.Application.Interfaces
{
    public interface IFriendshipService
    {
        Task<bool> AreFriendsAsync(string userId1, string userId2);
        Task AddFriendshipAsync(string userId1, string userId2);
    }
}