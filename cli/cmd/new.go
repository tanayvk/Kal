/*
Copyright © 2023 Tanay Karnik
*/
package cmd

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/spf13/cobra"
)

type editorFinishedMsg struct{ err error }

func openEditor(filePath string) {
	editor := os.Getenv("EDITOR")
	if editor == "" {
		editor = "vim"
	}
	cmd := exec.Command(editor, filePath)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
}

var newFileContent = `---
Subject: Subject goes here
---

A fresh *new* markdown email.
`

var newCmd = &cobra.Command{
	Use:   "new",
	Short: "Create a new email to send.",
	Long:  `TODO: write longer description of new command.`,
	Run: func(cmd *cobra.Command, args []string) {
		path := args[0]

		template := ""
		if len(args) == 2 {
			template = args[1]
		}

		content := newFileContent
		if template != "" {
			input, err := os.ReadFile(template)
			if err != nil {
				fmt.Println("Error reading template file:", err)
				return
			}
			content = string(input)
		}

		filePath := filepath.Join("emails", path+".md")

		if _, err := os.Stat("emails"); os.IsNotExist(err) {
			err := os.Mkdir("emails", os.ModePerm)
			if err != nil {
				fmt.Println("Error creating 'emails' folder:", err)
				return
			}
		}

		if _, err := os.Stat(filePath); !os.IsNotExist(err) {
			fmt.Println("Error: File already exists at", filePath)
			return
		}

		file, err := os.Create(filePath)
		if err != nil {
			fmt.Println("Error creating file:", err)
			return
		}
		defer file.Close()

		_, err = file.WriteString(content)
		if err != nil {
			fmt.Println("Error writing to file:", err)
			return
		}

		openEditor(filePath)
		fmt.Printf("Email created at '%s'\n", filePath)
	},
	Args: cobra.RangeArgs(1, 2),
}

// TODO: use bubbletea
func init() {
	rootCmd.AddCommand(newCmd)
}
