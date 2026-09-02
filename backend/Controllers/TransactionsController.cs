using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    // Security Helper: Extracts the user ID from the cryptographically verified JWT
    private string GetUserId()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedAccessException("Invalid token claims.");

        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyTransactions()
    {
        var userId = GetUserId();

        // Tenant Isolation: Only query records matching this specific user
        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(transactions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
    {
        var userId = GetUserId();

        var transaction = new Transaction
        {
            UserId = userId, // Forced from token, completely ignoring client input
            Amount = dto.Amount,
            Type = dto.Type,
            Category = dto.Category,
            Account = dto.Account,
            Note = dto.Note,
            Date = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(transaction);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(Guid id)
    {
        var userId = GetUserId();

        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null) return NotFound();

        // Hard Stop: Ensure the user actually owns the record they are trying to delete
        if (transaction.UserId != userId) return Forbid();

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}