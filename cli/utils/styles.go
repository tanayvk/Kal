package utils

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	processingStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("211"))
	doneStyle       = lipgloss.NewStyle().Margin(0, 0)
	checkMark       = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).SetString("✓")
)

func Prompt(background string, foreground string, title string, message string) tea.Cmd {
	var style = lipgloss.NewStyle().Background(lipgloss.Color(background)).Foreground(lipgloss.Color(foreground))
	var padding = strings.Repeat(" ", 6-len(title))
	return tea.Printf("\n%s%s  %s", padding, style.SetString(" "+title+" ").String(), message)
}
