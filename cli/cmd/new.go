/*
Copyright © 2023 Tanay Karnik
*/
package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"log"
	"os"
	"os/exec"
	"path/filepath"
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
Subject: subject goes here
---

A fresh *new* markdown email.
`

var newCmd = &cobra.Command{
	Use:   "new",
	Short: "Create a new email to send.",
	Long:  `TODO: write longer description of new command.`,
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) != 1 {
			fmt.Println("Error: Please provide a valid path.")
			return
		}

		path := args[0]
		filePath := filepath.Join("emails", path+".md")

		// Check if the "emails" folder exists, create it if not
		if _, err := os.Stat("emails"); os.IsNotExist(err) {
			err := os.Mkdir("emails", os.ModePerm)
			if err != nil {
				fmt.Println("Error creating 'emails' folder:", err)
				return
			}
		}

		// Check if the file already exists
		if _, err := os.Stat(filePath); !os.IsNotExist(err) {
			fmt.Println("Error: File already exists at", filePath)
			return
		}

		// Create the file
		file, err := os.Create(filePath)
		if err != nil {
			fmt.Println("Error creating file:", err)
			return
		}
		defer file.Close()

		// Write to the file
		_, err = file.WriteString(newFileContent)
		if err != nil {
			fmt.Println("Error writing to file:", err)
			return
		}

		openEditor(filePath)
		fmt.Printf("Email created at '%s'\n", filePath)
	},
	Args: cobra.ExactArgs(1),
}

func init() {
	rootCmd.AddCommand(newCmd)
}
