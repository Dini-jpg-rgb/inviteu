
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	fmt.Print("Masukkan password admin: ")

	reader := bufio.NewReader(os.Stdin)
	password, err := reader.ReadString('\n')
	if err != nil {
		fmt.Println("Gagal membaca password")
		os.Exit(1)
	}

	password = strings.TrimRight(password, "\r\n")

	if len(password) < 12 || len(password) > 72 {
		fmt.Println("Password harus 12–72 byte")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		fmt.Println("Gagal membuat password hash")
		os.Exit(1)
	}

	fmt.Println("Password hash:")
	fmt.Println(string(hash))
}
