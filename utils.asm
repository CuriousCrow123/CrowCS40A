# File:	utils.asm
# Purpose:	To define utilities which will be used in MIPS programs.
# Author:	Charles Kann
#
# Title to and ownership of all intellectual property rights
# in this file are the exclusive property of Charles W. Kann.
#
# Subprograms Index:
#   Exit 		Call syscall with a server 10 to exit the program
#   PrintNewLine	Print a new line character (\n) to the console
#   PrintInt	Print a string with an integer to the console
#   PrintString	Print a string to the console
#   PromptInt	Prompt for an int & return it to the calling program.
#   NOR		Bitwise NOR of two values
#   NAND		Bitwise NAND of two values
#   Mult4		Multiply a value by 4 using shift
#   Swap		Swap two values using XOR and MOVE
#
# Modification History
#     12/27/2014 - Initial release

# Subprogram:	Exit
# Author:  		Charles Kann
# Purpose:		to use syscall service 10 to exit a program
# Input/Output:	None
# Side effects:	The program is exited

.text
Exit:
    li $v0, 10
    syscall

# Subprogram:	PrintNewLine
# Author:  		Charles Kann
# Purpose:		to output a new line to the user console
# Input/Output:	None
# Side effects:	A new line character is printed to the user's console

.text
PrintNewLine:
    li $v0, 4
    la $a0, __PNL_newline
    syscall
    jr $ra

.data
   __PNL_newline:   .asciiz "\n"


# Subprogram: 	PrintInt
# Author:		Charles W. Kann
# Purpose:		To print a string to the console
# Input:		$a0 - The address of the string to print.
#			$a1 - The value of the int to print
# Output:		None
# Side effects:	The String is printed followed by the integer value.

.text
PrintInt:
    # Print string.  The string address is already in $a0
    li $v0, 4
    syscall

    # Print integer.   The integer value is in $a1, and must
    # be first moved to $a0.
    move $a0, $a1
    li $v0, 1
    syscall

    #Return
    jr $ra

# Subprogram: 	PrintString
# Author:		Charles W. Kann
# Purpose:		To print a string to the console
# Input:		$a0 - The address of the string to print.
# Output:		None
# Side effects:	The String is printed to the console.

.text
PrintString:
    addi $v0, $zero, 4
    syscall
    jr $ra

# Subprogram: 	PromptInt
# Author:		Charles W. Kann
# Purpose:		To prompt the user for an integer input, and
#               	to return that input value to the caller.
# Input:		$a0 - The address of the string to print.
# Output:		$v0 - The value the user entered
# Side effects:	The String is printed followed by the integer value.

.text
PromptInt:
    # Print the prompt, which is already in $a0
    li $v0, 4
    syscall

    # Read the integer.  Note: at the end of the syscall the value is
    # already in $v0, so there is no need to move it anywhere.
    li $v0, 5
    syscall

    #Return
    jr $ra

# Subprogram:	NOR
# Author:		[student name]
# Purpose:		Performs bitwise NOR on two values
# Input:		$a0 = first value, $a1 = second value
# Output:		$v0 = $a0 NOR $a1
# Side effects:	none

.text
NOR:
    nor   $v0, $a0, $a1    # NOR is a real MIPS instruction
    jr    $ra

# Subprogram:	NAND
# Author:		[student name]
# Purpose:		Performs bitwise NAND on two values
# Input:		$a0 = first value, $a1 = second value
# Output:		$v0 = $a0 NAND $a1
# Side effects:	none

.text
NAND:
    and   $v0, $a0, $a1    # Step 1: AND the two inputs
    not   $v0, $v0         # Step 2: NOT the result (NAND = NOT(AND))
    jr    $ra

# Subprogram:	Mult4
# Author:		[student name]
# Purpose:		Multiplies input by 4 using only the shift operation
# Input:		$a0 = value to multiply
# Output:		$v0 = $a0 * 4
# Side effects:	none

.text
Mult4:
    sll   $v0, $a0, 2      # Shift left by 2 = multiply by 2^2 = 4
    jr    $ra

# Subprogram:	Swap
# Author:		[student name]
# Purpose:		Swaps two values using only XOR and MOVE operations
# Input:		$a0 = first value, $a1 = second value
# Output:		$v0 = original $a1, $v1 = original $a0
# Side effects:	$a0 and $a1 are modified

.text
Swap:
    xor   $a0, $a0, $a1    # $a0 = A XOR B
    xor   $a1, $a0, $a1    # $a1 = (A XOR B) XOR B = A
    xor   $a0, $a0, $a1    # $a0 = (A XOR B) XOR A = B
    move  $v0, $a0         # $v0 = B (original $a1)
    move  $v1, $a1         # $v1 = A (original $a0)
    jr    $ra
