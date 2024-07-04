package utils

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	titleStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("37")).
			Foreground(lipgloss.Color("16"))
	messageStyle = lipgloss.NewStyle()
	infoStyle    = lipgloss.NewStyle()
	answerStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("39"))
	errorStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("160"))
)

type Prompt struct {
	Title       string
	Message     string
	Error       string
	LeftPadding int
}

func (p Prompt) Render() string {
	var padding = strings.Repeat(" ", p.LeftPadding-len(p.Title))
	error := ""
	if len(p.Error) > 0 {
		var padding = strings.Repeat(" ", p.LeftPadding-3)
		error = fmt.Sprintf("\n%s%s%s", padding, errorStyle.Render("ERROR: "), p.Error)
	}
	return fmt.Sprintf("\n%s%s  %s%s", padding,
		titleStyle.Render(" "+p.Title+" "), p.Message, error)
}

func (p Prompt) RenderAnswer(answer string) string {
	var padding = strings.Repeat(" ", p.LeftPadding+2)
	return fmt.Sprintf("%s%s", padding, answerStyle.Render("> "+answer))
}

func (p *Prompt) Reset(title string, message string) {
	p.Error = ""
	p.Title = title
	p.Message = message
}
