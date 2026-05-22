using Microsoft.EntityFrameworkCore;
using VideoCall.Domain.Entities;

namespace VideoCall.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
        public DbSet<Friendship> Friendships => Set<Friendship>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<MessageReadReceipt> MessageReadReceipts => Set<MessageReadReceipt>();
        public DbSet<MessageReaction> MessageReactions => Set<MessageReaction>();
        public DbSet<CallLog> CallLogs => Set<CallLog>();
        public DbSet<BlockedUser> BlockedUsers => Set<BlockedUser>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── USERS ──────────────────────────────────────────────
            modelBuilder.Entity<User>(b =>
            {
                b.HasKey(u => u.Id);
                b.HasIndex(u => u.PhoneNumber).IsUnique();
                b.HasIndex(u => u.Username).IsUnique();
                b.HasIndex(u => u.Email).IsUnique();
                b.Property(u => u.Username).HasMaxLength(50).IsRequired();
                b.Property(u => u.PhoneNumber).HasMaxLength(20).IsRequired();
                b.Property(u => u.PasswordHash).IsRequired();
                b.Property(u => u.Role).HasDefaultValue("User");
                b.Property(u => u.IsActive).HasDefaultValue(true);
                b.Ignore(u => u.Name); // Computed property
            });

            // ── REFRESH TOKENS ─────────────────────────────────────
            modelBuilder.Entity<RefreshToken>(b =>
            {
                b.HasKey(r => r.Id);
                b.HasIndex(r => r.Token).IsUnique();
                b.HasOne(r => r.User)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── USER SESSIONS ──────────────────────────────────────
            modelBuilder.Entity<UserSession>(b =>
            {
                b.HasKey(s => s.Id);
                b.HasOne(s => s.User)
                    .WithMany(u => u.Sessions)
                    .HasForeignKey(s => s.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── FRIEND REQUESTS ────────────────────────────────────
            modelBuilder.Entity<FriendRequest>(b =>
            {
                b.HasKey(fr => fr.Id);
                b.HasOne(fr => fr.Sender)
                    .WithMany(u => u.SentFriendRequests)
                    .HasForeignKey(fr => fr.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasOne(fr => fr.Receiver)
                    .WithMany(u => u.ReceivedFriendRequests)
                    .HasForeignKey(fr => fr.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(fr => new { fr.SenderId, fr.ReceiverId }).IsUnique();
                b.Property(fr => fr.Status).HasConversion<string>();
            });

            // ── FRIENDSHIPS ────────────────────────────────────────
            modelBuilder.Entity<Friendship>(b =>
            {
                b.HasKey(f => f.Id);
                b.HasOne(f => f.User1)
                    .WithMany(u => u.Friendships1)
                    .HasForeignKey(f => f.User1Id)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasOne(f => f.User2)
                    .WithMany(u => u.Friendships2)
                    .HasForeignKey(f => f.User2Id)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(f => new { f.User1Id, f.User2Id }).IsUnique();
            });

            // ── MESSAGES ───────────────────────────────────────────
            modelBuilder.Entity<Message>(b =>
            {
                b.HasKey(m => m.Id);
                b.HasOne(m => m.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasOne(m => m.Receiver)
                    .WithMany(u => u.ReceivedMessages)
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.Property(m => m.MessageType).HasConversion<string>();
                b.HasIndex(m => m.CreatedAt);
                b.HasIndex(m => new { m.SenderId, m.ReceiverId });
                // Global soft-delete filter
                b.HasQueryFilter(m => !m.IsDeleted);
            });

            // ── MESSAGE READ RECEIPTS ──────────────────────────────
            modelBuilder.Entity<MessageReadReceipt>(b =>
            {
                b.HasKey(r => r.Id);
                b.HasOne(r => r.Message)
                    .WithMany(m => m.ReadReceipts)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasOne(r => r.Reader)
                    .WithMany()
                    .HasForeignKey(r => r.ReaderId)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasIndex(r => new { r.MessageId, r.ReaderId }).IsUnique();
                b.HasQueryFilter(r => !r.Message.IsDeleted);
            });

            // ── MESSAGE REACTIONS ──────────────────────────────────
            modelBuilder.Entity<MessageReaction>(b =>
            {
                b.HasKey(r => r.Id);
                b.HasOne(r => r.Message)
                    .WithMany(m => m.Reactions)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                // One reaction per user per message
                b.HasIndex(r => new { r.MessageId, r.UserId, r.EmojiCode }).IsUnique();
                b.HasQueryFilter(r => !r.Message.IsDeleted);
            });

            // ── CALL LOGS ─────────────────────────────────────────
            modelBuilder.Entity<CallLog>(b =>
            {
                b.HasKey(c => c.Id);
                b.HasOne(c => c.Caller)
                    .WithMany(u => u.InitiatedCalls)
                    .HasForeignKey(c => c.CallerId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasOne(c => c.Receiver)
                    .WithMany(u => u.ReceivedCalls)
                    .HasForeignKey(c => c.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.Property(c => c.CallType).HasConversion<string>();
                b.Property(c => c.Status).HasConversion<string>();
                b.HasIndex(c => c.StartedAt);
            });

            // ── BLOCKED USERS ─────────────────────────────────────
            modelBuilder.Entity<BlockedUser>(b =>
            {
                b.HasKey(bu => bu.Id);
                b.HasOne(bu => bu.Blocker)
                    .WithMany(u => u.BlockedUsers)
                    .HasForeignKey(bu => bu.BlockerId)
                    .OnDelete(DeleteBehavior.Cascade);
                b.HasOne(bu => bu.Blocked)
                    .WithMany()
                    .HasForeignKey(bu => bu.BlockedId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(bu => new { bu.BlockerId, bu.BlockedId }).IsUnique();
            });
        }
    }
}
