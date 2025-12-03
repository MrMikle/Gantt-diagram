using Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<TaskStage> Stages => Set<TaskStage>();
        public DbSet<Responsible> Responsibles => Set<Responsible>();
        public DbSet<TaskDependency> Dependencies => Set<TaskDependency>();

        protected override void OnModelCreating(ModelBuilder model)
        {
            base.OnModelCreating(model);

            model.Entity<Subject>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Name).IsRequired();
            });

            model.Entity<Project>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(x => x.Subject).WithMany(s => s.Projects).HasForeignKey(x => x.SubjectId).OnDelete(DeleteBehavior.Cascade);
                b.Property(x => x.Name).IsRequired();
            });

            model.Entity<TaskItem>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(x => x.Project).WithMany(p => p.Tasks).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
                b.Property(x => x.Title).IsRequired();
                b.Property(x => x.Deadline).IsRequired();
            });

            model.Entity<TaskStage>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(x => x.Task).WithMany(t => t.Stages).HasForeignKey(x => x.TaskItemId).OnDelete(DeleteBehavior.Cascade);
            });

            model.Entity<Responsible>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(x => x.Project).WithMany(p => p.Responsibles).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            });

            model.Entity<TaskDependency>(b =>
            {
                b.HasKey(x => x.Id);
                b.HasOne(d => d.Task).WithMany(t => t.Dependencies).HasForeignKey(d => d.TaskId).OnDelete(DeleteBehavior.Cascade);
                b.HasOne(d => d.DependsOn).WithMany().HasForeignKey(d => d.DependsOnTaskId).OnDelete(DeleteBehavior.Restrict);
                b.HasIndex(d => new { d.TaskId, d.DependsOnTaskId }).IsUnique(false);
            });
        }
    }
}