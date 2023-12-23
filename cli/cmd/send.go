/*
Copyright © 2023 Tanay Karnik
*/
package cmd

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"encoding/json"
	"io"

	"net/http"

	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/viper"
)

type Response struct {
	Count int `json:"count"`
}

type model struct {
	sending    bool
	prompt     bool
	validated  bool
	processing bool
	width      int
	height     int
	spinner    spinner.Model
	done       bool
	count      int
	filePath   string
	fileData   string
}

var (
	processingStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("211"))
	doneStyle       = lipgloss.NewStyle().Margin(0, 0)
	checkMark       = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).SetString("✓")
)

func newModel(file string) model {
	s := spinner.New()
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("63"))
	return model{
		spinner:  s,
		filePath: file,
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(validateEmail(m.filePath), m.spinner.Tick)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc", "q":
			return m, tea.Quit
		case "y":
			if m.prompt {
				m.prompt = false
				m.sending = true
				return m, tea.Sequence(tea.Printf("%s %s %d %s", checkMark, "Email will be sent to", m.count, "subscribers."), sendEmail(m.fileData))
			}
		}
	case emailValidatedMsg:
		m.validated = true
		m.processing = true
		m.fileData = msg.fileData
		return m, tea.Sequence(tea.Printf("%s %s", checkMark, "Email looks good."), checkEmail())
	case emailCheckedMsg:
		m.processing = false
		m.prompt = true
		m.count = msg.count
		return m, nil
	case emailSentMsg:
		m.done = true
		return m, tea.Quit
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	return m, nil
}

func (m model) View() string {
	if m.done {
		return doneStyle.Render(fmt.Sprintf("%s Done!\n", checkMark))
	}
	spin := m.spinner.View() + " "
	if !m.validated {
		return spin + " Validating email..."
	} else if m.processing {
		return spin + " Processing..."
	} else if m.sending {
		return spin + " Sending emails..."
	} else if m.prompt {
		return "Do you want to send the email to " + fmt.Sprintf("%d", m.count) + " subscribers? [y/n]"
	}
	return ""
}

var sendCmd = &cobra.Command{
	Use:   "send",
	Short: "A brief description of your command",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		p := tea.NewProgram(newModel(args[0]))
		if _, err := p.Run(); err != nil {
			log.Fatal(err)
		}
	},
	Args: cobra.RangeArgs(0, 1),
}

func init() {
	rootCmd.AddCommand(sendCmd)
}

type emailValidatedMsg struct {
	fileData string
}

// TODO: handle for error with checking
type emailCheckedMsg struct {
	count int
}
type emailSentMsg struct{}

func validateEmail(filePath string) tea.Cmd {
	return func() tea.Msg {
		// TODO: don't convert anything, just validate the markdown
		data, _ := readFileToString(fmt.Sprintf("emails/%s.md", filePath))
		return emailValidatedMsg{
			fileData: data,
		}
	}
}

func checkEmail() tea.Cmd {
	return func() tea.Msg {
		return emailCheckedMsg{count: getSubscriberCount()}
	}
}

func sendEmail(fileData string) tea.Cmd {
	baseURL := viper.GetString("endpoint")
	return func() tea.Msg {
		http.Post(baseURL+"/send", "application/json", strings.NewReader(fileData))
		return emailSentMsg{}
	}
}

func getSubscriberCount() int {
	baseURL := viper.GetString("endpoint")
	response, err := http.Get(baseURL + "/checkSend")
	if err != nil {
		return 0
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return 0
	}
	var jsonResponse Response
	err = json.Unmarshal(body, &jsonResponse)
	if err != nil {
		return 0
	}
	count := jsonResponse.Count
	return count
}

func readFileToString(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
