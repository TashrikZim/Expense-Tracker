namespace Backend.DTOs;

public class CreateTransactionDto
{
    public decimal Amount { get; set; }
    public required string Type { get; set; }
    public required string Category { get; set; }
    public required string Account { get; set; }
    public string? Note { get; set; }
}