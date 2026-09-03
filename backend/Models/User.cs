using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.Models;

public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? PasswordHash { get; set; }

    public string AuthProvider { get; set; } = "Local";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}