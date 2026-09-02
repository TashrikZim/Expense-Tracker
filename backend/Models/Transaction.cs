namespace Backend.Models;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public decimal Amount { get; set; }
    public required string Type { get; set; } // "Income" or "Expense"
    public required string Category { get; set; }
    public required string Account { get; set; } // "Bank", "Cash", etc.
    public string? Note { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}