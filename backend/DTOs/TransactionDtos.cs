using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public record CreateTransactionDto(
    [Required] decimal Amount,
    [Required] string Type,
    [Required] string Category,
    [Required] string Account,
    string? Note,
    DateTime? Date
);

public record UpdateTransactionDto(
    [Required] decimal Amount,
    [Required] string Type,
    [Required] string Category,
    [Required] string Account,
    string? Note,
    DateTime? Date
);