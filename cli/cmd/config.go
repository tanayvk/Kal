package cmd

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"kal/utils"
)

type ConfigStatus int

const (
	CONFIG_STATUS_ENDPOINT ConfigStatus = iota
	CONFIG_STATUS_CHECKING_ENDPOINT
	CONFIG_STATUS_TOKEN
	CONFIG_STATUS_CHECKING_TOKEN
	CONFIG_STATUS_WRITING
	CONFIG_STATUS_HOST
	CONFIG_STATUS_PORT
	CONFIG_STATUS_USER
	CONFIG_STATUS_PASS
	CONFIG_STATUS_EMAIL
	CONFIG_STATUS_NAME
	CONFIG_STATUS_SETTING_SENDER
	CONFIG_STATUS_DONE
)

type configModel struct {
	status ConfigStatus

	endpoint string
	token    string
	host     string
	port     string
	user     string
	pass     string
	email    string
	name     string

	spinner spinner.Model
	input   textinput.Model
	p       utils.Prompt
}

func initConfigModel() configModel {
	s := spinner.New(spinner.WithSpinner(spinner.Dot))
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("63"))

	m := configModel{
		endpoint: viper.GetString("endpoint"),
		token:    viper.GetString("senderToken"),
		spinner:  s,
		status:   CONFIG_STATUS_ENDPOINT,
		input:    textinput.New(),
	}
	m.input.Placeholder = "https://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com"
	m.input.SetValue(m.endpoint)
	m.input.Focus()

	m.p.LeftPadding = 10

	return m
}

func (m configModel) Init() tea.Cmd {
	return tea.Sequence(
		printKal(),
		tea.Batch(textinput.Blink, m.spinner.Tick),
	)
}

func (m configModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return m, tea.Quit
		case "enter":
			{
				switch m.status {
				case CONFIG_STATUS_ENDPOINT:
					m.status = CONFIG_STATUS_CHECKING_ENDPOINT
					m.endpoint = m.input.Value()
					return m, tea.Sequence(
						tea.Printf(m.p.Render()),
						checkEndpoint(m),
					)
				case CONFIG_STATUS_TOKEN:
					m.status = CONFIG_STATUS_CHECKING_TOKEN
					m.token = m.input.Value()
					return m, tea.Sequence(
						tea.Printf(m.p.Render()),
						checkToken(m),
					)
				case CONFIG_STATUS_HOST:
					m.status = CONFIG_STATUS_PORT
					m.host = m.input.Value()
					m.input.Reset()
					m.input.SetValue(m.port)
					m.input.Placeholder = "587"
					previous := m.p.Render()
					m.p.Reset("port", "Enter the SMTP Port.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(m.host)),
					)
				case CONFIG_STATUS_PORT:
					m.status = CONFIG_STATUS_USER
					// TODO: handle port should be integer between 0-65535
					m.port = m.input.Value()
					m.input.Reset()
					m.input.SetValue(m.user)
					m.input.Placeholder = "Username"
					previous := m.p.Render()
					m.p.Reset("user", "Enter the SMTP username.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(m.port)),
					)
				case CONFIG_STATUS_USER:
					m.status = CONFIG_STATUS_PASS
					m.user = m.input.Value()
					m.input.Reset()
					m.input.EchoMode = textinput.EchoPassword
					m.input.SetValue(m.pass)
					m.input.Placeholder = "Password"
					previous := m.p.Render()
					m.p.Reset("pass", "Enter the SMTP password.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(m.user)),
					)
				case CONFIG_STATUS_PASS:
					m.status = CONFIG_STATUS_EMAIL
					m.pass = m.input.Value()
					m.input.Reset()
					m.input.EchoMode = textinput.EchoNormal
					m.input.SetValue(m.email)
					m.input.Placeholder = "email@domain.com"
					previous := m.p.Render()
					m.p.Reset("email", "Enter the sender email address.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(strings.Repeat("x", len(m.pass)))),
					)
				case CONFIG_STATUS_EMAIL:
					m.status = CONFIG_STATUS_NAME
					m.email = m.input.Value()
					m.input.Reset()
					m.input.SetValue(m.name)
					m.input.Placeholder = "John Doe"
					previous := m.p.Render()
					m.p.Reset("name", "Enter the sender name.")
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(m.email)),
					)
				case CONFIG_STATUS_NAME:
					m.status = CONFIG_STATUS_SETTING_SENDER
					m.name = m.input.Value()
					previous := m.p.Render()
					return m, tea.Sequence(
						tea.Printf(previous),
						tea.Printf(m.p.RenderAnswer(m.name)),
						setSenderConfig(m),
					)
				}
			}
		}
	case printKalMsg:
		m.p.Reset("Kal", "Configure Kal.")
		previous := m.p.Render()
		m.p.Reset("endpoint", "Enter the API Endpoint for your Kal deploy.")
		return m, tea.Printf(previous)
	case endpointCheckMsg:
		if msg.failed {
			m.status = CONFIG_STATUS_ENDPOINT
			return m, tea.Printf("            Endpoint check failed.")
		}
		m.status = CONFIG_STATUS_TOKEN
		m.input.SetValue(m.token)
		m.input.Placeholder = "Base64 Token"
		m.p.Reset("token", "Enter your sender token.")
		return m, tea.Sequence(
			tea.Printf(m.p.RenderAnswer(m.endpoint)),
			tea.Printf("            %s Endpoint valid.", checkMark),
		)
	case tokenCheckMsg:
		if msg.failed {
			m.status = CONFIG_STATUS_TOKEN
			return m, tea.Printf("            Token check failed.")
		}
		m.status = CONFIG_STATUS_WRITING
		m.host = msg.config.host
		m.port = msg.config.port
		m.user = msg.config.user
		m.pass = msg.config.pass
		m.name = msg.config.name
		m.email = msg.config.email
		return m, tea.Sequence(
			tea.Printf(m.p.RenderAnswer(m.token)),
			tea.Printf("            %s Sender token valid.", checkMark),
			writeConfig(m),
		)
	case writeConfigMsg:
		if msg.failed {
			return m, tea.Sequence(
				tea.Printf("             Writing config failed."),
				tea.Quit,
			)
		}
		m.status = CONFIG_STATUS_HOST
		m.input.SetValue(m.host)
		m.input.Placeholder = "smtp-mail.outlook.com"
		m.p.Reset("host", "Enter the SMTP Host.")
		return m, nil
	case senderConfigMsg:
		if msg.failed {
			return m, tea.Sequence(
				tea.Printf("\n              Setting sender config failed."),
				tea.Quit,
			)
		}
		m.status = CONFIG_STATUS_DONE
		return m, tea.Sequence(
			tea.Printf("\n            %s Configuration successful.", checkMark),
			tea.Quit,
		)
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}
	var input, inputCmd = m.input.Update(msg)
	m.input = input
	return m, inputCmd
}

func (m configModel) View() string {
	padding := "            "
	spin := padding + m.spinner.View()
	switch m.status {
	// case CONFIG_STATUS_DONE:
	// 	return doneStyle.Render(fmt.Sprintf("\n        %s Done!\n", checkMark))
	case CONFIG_STATUS_CHECKING_ENDPOINT:
		return spin + "Checking endpoint..."
	case CONFIG_STATUS_CHECKING_TOKEN:
		return spin + "Checking sender token..."
	case CONFIG_STATUS_WRITING:
		return spin + "Writing config to current directory..."
	case CONFIG_STATUS_SETTING_SENDER:
		return "\n" + spin + "Setting sender config..."
	case CONFIG_STATUS_ENDPOINT:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_HOST:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_PORT:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_USER:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_PASS:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_NAME:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_EMAIL:
		return m.p.Render() + "\n" + padding + m.input.View()
	case CONFIG_STATUS_TOKEN:
		return m.p.Render() + "\n" + padding + m.input.View()
	}
	return ""
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Configuring Kal in the current directory.",
	Run: func(cmd *cobra.Command, args []string) {
		f, err := os.OpenFile("log.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening file: %v", err)
		}
		defer f.Close()
		log.SetOutput(f)

		p := tea.NewProgram(initConfigModel())
		if _, err := p.Run(); err != nil {
			log.Fatal(err)
		}
	},
}

func init() {
	rootCmd.AddCommand(configCmd)
}

type printKalMsg struct{}

func printKal() tea.Cmd {
	return func() tea.Msg { return printKalMsg{} }
}

type endpointCheckMsg struct {
	failed bool
}

func checkEndpoint(m configModel) tea.Cmd {
	return func() tea.Msg {
		response, err := http.Get(m.endpoint + "/status")
		if err != nil {
			return endpointCheckMsg{failed: true}
		}
		defer response.Body.Close()
		if response.StatusCode == http.StatusOK {
			return endpointCheckMsg{failed: false}
		}
		return endpointCheckMsg{failed: true}
	}
}

type tokenCheckMsg struct {
	failed bool
	config configModel
}

func checkToken(m configModel) tea.Cmd {
	return func() tea.Msg {
		client := &http.Client{}
		req, reqErr := http.NewRequest("GET", m.endpoint+"/sender", nil)
		if reqErr != nil {
			return tokenCheckMsg{failed: true}
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+m.token)
		response, err := client.Do(req)
		if err != nil {
			return tokenCheckMsg{failed: true}
		}
		defer response.Body.Close()
		if response.StatusCode == http.StatusOK {
			type credsResponse struct {
				Creds creds `json:"creds"`
			}
			var credsResp credsResponse
			if err := json.NewDecoder(response.Body).Decode(&credsResp); err != nil {
				return tokenCheckMsg{failed: true}
			}

			updatedConfig := configModel{
				host:  credsResp.Creds.Host,
				port:  credsResp.Creds.Port,
				user:  credsResp.Creds.User,
				pass:  credsResp.Creds.Pass,
				email: credsResp.Creds.Email,
				name:  credsResp.Creds.Name,
			}
			return tokenCheckMsg{failed: false, config: updatedConfig}
		}
		return tokenCheckMsg{failed: true}
	}
}

type writeConfigMsg struct{ failed bool }

func writeConfig(m configModel) tea.Cmd {
	return func() tea.Msg {
		viper.Set("endpoint", m.endpoint)
		viper.Set("senderToken", m.token)
		err := viper.WriteConfigAs("./.kal")
		if err != nil {
			return writeConfigMsg{failed: true}
		}
		return writeConfigMsg{}
	}
}

type creds struct {
	Host  string `json:"host"`
	Port  string `json:"port"`
	User  string `json:"user"`
	Pass  string `json:"pass"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
type configPayload struct {
	Creds creds `json:"creds"`
}
type senderConfigMsg struct{ failed bool }

func setSenderConfig(m configModel) tea.Cmd {
	return func() tea.Msg {
		creds := creds{
			Host:  m.host,
			Port:  m.port,
			User:  m.user,
			Pass:  m.pass,
			Name:  m.name,
			Email: m.email,
		}
		payload := configPayload{
			Creds: creds,
		}
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return senderConfigMsg{failed: true}
		}

		client := &http.Client{}
		req, err := http.NewRequest(
			"POST",
			viper.GetString("endpoint")+"/sender_config",
			strings.NewReader(string(jsonData)),
		)
		if err != nil {
			// TODO: handle errors
			return senderConfigMsg{failed: true}
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+viper.GetString("senderToken"))
		response, rerr := client.Do(req)
		if rerr != nil || response.StatusCode != http.StatusOK {
			// TODO: handle errors
			return senderConfigMsg{failed: true}
		}
		defer response.Body.Close()

		return senderConfigMsg{failed: false}
	}
}
