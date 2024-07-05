/*
Copyright © 2023 Tanay Karnik
*/
package cmd

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"encoding/json"
	"io"

	"net/http"

	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/olebedev/when"
	"github.com/olebedev/when/rules/common"
	"github.com/olebedev/when/rules/en"
	"github.com/spf13/viper"

	"kal/utils"
)

type Status int

const (
	FILE Status = iota
	VALIDATING
	FILTER
	TIME
	CHECKING
	PROMPT
	SENDING
	DONE
)

type sendModel struct {
	status Status

	count     int
	filePath  string
	fileData  string
	filter    string
	time      string
	timeValue string

	spinner spinner.Model
	input   textinput.Model
	list    list.Model
	p       utils.Prompt
}

var (
	doneStyle         = lipgloss.NewStyle().Margin(0, 0)
	checkMark         = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).SetString("✓")
	crossMark         = lipgloss.NewStyle().Foreground(lipgloss.Color("160")).SetString("✕")
	titleStyle        = lipgloss.NewStyle().MarginLeft(2)
	itemStyle         = lipgloss.NewStyle().PaddingLeft(10)
	selectedItemStyle = lipgloss.NewStyle().PaddingLeft(8).Foreground(lipgloss.Color("39"))
	primaryStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("39"))
	// errorStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("39"))
	paginationStyle = list.DefaultStyles().PaginationStyle.PaddingLeft(4)
	helpStyle       = list.DefaultStyles().HelpStyle.PaddingLeft(4).PaddingBottom(1)
	quitTextStyle   = lipgloss.NewStyle().Margin(1, 0, 2, 4)
)

type itemDelegate struct{}

func (d itemDelegate) Height() int                             { return 1 }
func (d itemDelegate) Spacing() int                            { return 0 }
func (d itemDelegate) Update(_ tea.Msg, _ *list.Model) tea.Cmd { return nil }
func (d itemDelegate) Render(w io.Writer, m list.Model, index int, listItem list.Item) {
	i, ok := listItem.(item)
	if !ok {
		return
	}

	str := fmt.Sprintf("%s", i)

	fn := itemStyle.Render
	if index == m.Index() {
		fn = func(s ...string) string {
			return selectedItemStyle.Render("> " + strings.Join(s, ""))
		}
	}

	fmt.Fprint(w, fn(str))
}

func initSendModel(filePath string, filter string, time string) sendModel {
	s := spinner.New(spinner.WithSpinner(spinner.Dot))
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("63"))

	m := sendModel{
		filePath: filePath,
		input:    textinput.New(),
		spinner:  s,
		filter:   filter,
		time:     time,
	}

	// TODO: start with choosing file
	// m.status = FILE
	m.status = VALIDATING
	m.input.Placeholder = "Choose a file."
	m.input.SetValue(filePath)
	m.input.Focus()

	const (
		defaultWidth = 20
		listHeight   = 5
	)

	items := []list.Item{
		item("Yes"),
		item("No. Restart."),
	}

	l := list.New(items, itemDelegate{}, defaultWidth, listHeight)
	l.Styles.Title = titleStyle
	l.Styles.PaginationStyle = paginationStyle
	l.Styles.HelpStyle = helpStyle
	l.SetShowHelp(false)
	l.SetShowTitle(false)
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(false)
	m.list = l

	m.p.LeftPadding = 6
	m.p.Reset("Kal", "Send a new email.")

	return m
}

func (m sendModel) Init() tea.Cmd {
	return tea.Sequence(
		// TODO: start with file
		// utils.Prompt("37", "16", "email", "Choose the email you want to send."),
		validateEmail(m.filePath),
		tea.Batch(textinput.Blink, m.spinner.Tick))
}

type item string

func (i item) FilterValue() string { return "" }

func (m sendModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return m, tea.Quit
		case "q":
			if m.status != FILE && m.status != FILTER && m.status != TIME {
				return m, tea.Quit
			}
		case "enter":
			switch m.status {
			case FILE:
				m.filePath = m.input.Value()
				return m, validateEmail(m.filePath)
			case FILTER:
				m.filter = m.input.Value()
				// TODO: validate filter
				m.status = TIME
				m.input.SetValue(m.time)
				m.input.Placeholder = "Now"

				filterString := "None. Sending to all subscribers."
				if len(m.filter) > 0 {
					filterString = m.filter
				}
				previous := m.p.Render()
				m.p.Reset("time", "Schedule a time for the email.")
				return m, tea.Sequence(
					tea.Printf(previous),
					tea.Printf(m.p.RenderAnswer(filterString)),
				)
			case TIME:
				m.time = m.input.Value()
				w := when.New(nil)
				w.Add(en.All...)
				w.Add(common.All...)

				timeString := "Sending right away!"
				if len(m.time) > 0 {
					r, err := w.Parse(m.time, time.Now())
					if err != nil || r == nil {
						m.p.Error = "Invalid time."
						return m, nil
					} else {
						m.timeValue = r.Time.Local().Format(time.RFC3339)
						timeString = r.Time.Local().Format(time.RFC822)
					}
				}

				m.status = CHECKING
				return m, tea.Sequence(
					tea.Printf(m.p.Render()),
					tea.Printf(m.p.RenderAnswer(timeString)),
					checkEmail(m))
			case PROMPT:
				i, ok := m.list.SelectedItem().(item)
				if ok && string(i) == "Yes" {
					m.status = SENDING
					return m, tea.Sequence(
						tea.Printf("\n        %s %s %d %s", checkMark,
							"Email will be sent to", m.count, "subscribers."),
						sendEmail(m))
				} else {
					m.status = FILTER
					m.input.SetValue(m.filter)
					m.input.Placeholder = "None"
					previous := m.p.Render()
					m.p.Reset("filter", "Enter a filter expression.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer("Restart")),
					)
				}
			}
		}
	case emailValidatedMsg:
		m.status = FILTER
		m.fileData = msg.fileData
		m.input.SetValue(m.filter)
		m.input.Placeholder = "None"
		previous := m.p.Render()
		m.p.Reset("filter", "Enter a filter expression.")
		return m, tea.Sequence(
			tea.Printf(previous),
			tea.Printf("        %s %s", checkMark, "Email looks good."),
		)
	case emailCheckedMsg:
		m.status = PROMPT
		m.count = msg.count
		m.p.Reset("prompt", fmt.Sprintf("Do you want to send the email to %d subscribers?", m.count))
		return m, nil
	case emailSentMsg:
		m.status = DONE
		return m, tea.Quit
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	if m.status == PROMPT {
		var prompt, promptCmd = m.list.Update(msg)
		m.list = prompt
		return m, promptCmd
	}
	var input, inputCmd = m.input.Update(msg)
	m.input = input
	return m, inputCmd
}

func (m sendModel) View() string {
	spin := "\n        " + m.spinner.View()
	switch m.status {
	case DONE:
		return doneStyle.Render(fmt.Sprintf("        %s Done!\n", checkMark))
	case VALIDATING:
		return spin + "Validating email..."
	case CHECKING:
		return spin + "Processing..."
	case SENDING:
		return spin + "Sending emails..."
	case PROMPT:
		return m.p.Render() + "\n" + m.list.View()
	case FILE:
		return m.p.Render() + "\n        " + m.input.View()
	case FILTER:
		return m.p.Render() + "\n        " + m.input.View()
	case TIME:
		return m.p.Render() + "\n        " + m.input.View()
	}
	return ""
}

var sendCmd = &cobra.Command{
	Use:   "send",
	Short: "Send the email!",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		f, err := os.OpenFile("log.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening file: %v", err)
		}
		defer f.Close()
		log.SetOutput(f)

		// TODO: read filter and time from command line
		// and also have a -y flag
		p := tea.NewProgram(initSendModel(args[0], "", ""))
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
type emailCheckedMsg struct {
	// TODO: handle for error with checking
	count int
}
type emailSentMsg struct{}

func validateEmail(filePath string) tea.Cmd {
	return func() tea.Msg {
		// TODO: don't convert anything, just validate the markdown
		// check if file exists
		// also support for various ways to point to the file
		// with extension, without extension
		data, _ := readFileToString(fmt.Sprintf("emails/%s.md", filePath))
		return emailValidatedMsg{
			fileData: data,
		}
	}
}

func checkEmail(m sendModel) tea.Cmd {
	return func() tea.Msg {
		return emailCheckedMsg{count: checkSendEmail(m.fileData, m.filter, "", true)}
	}
}

func sendEmail(m sendModel) tea.Cmd {
	return func() tea.Msg {
		checkSendEmail(m.fileData, m.filter, m.timeValue, false)
		return emailSentMsg{}
	}
}

func checkSendEmail(fileData string, filter string, time string, dry bool) int {
	baseURL := viper.GetString("endpoint")
	senderToken := viper.GetString("senderToken")
	jsonData := map[string]interface{}{
		"fileData": fileData,
		"time":     time,
		"filter":   filter,
	}

	jsonValue, err := json.Marshal(jsonData)
	if err != nil {
		return 0
	}

	path := "/send"
	if dry {
		path = "/check_send"
	}

	client := &http.Client{}
	req, _ := http.NewRequest("POST", baseURL+path, strings.NewReader(string(jsonValue)))
	if err != nil {
		// Handle error
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+senderToken)
	response, err := client.Do(req)
	if err != nil {
		// Handle error
	}
	defer response.Body.Close()

	if err != nil {
		fmt.Printf("err %s", err)
		return 0
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return 0
	}
	type Response struct {
		Count int `json:"count"`
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
